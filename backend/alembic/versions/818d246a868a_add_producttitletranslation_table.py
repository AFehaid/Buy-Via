"""Add ProductTitleTranslation table

Revision ID: 818d246a868a
Revises: be7547aa1e42
Create Date: 2025-01-14 01:04:18.595001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '818d246a868a'
down_revision = 'be7547aa1e42'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### Add ProductTitleTranslation table ###
    op.create_table(
        'product_title_translations',
        sa.Column('translation_id', sa.Integer, primary_key=True, index=True),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='CASCADE')),
        sa.Column('language', sa.String, nullable=False),  # Language code (e.g., "en", "ar", "es")
        sa.Column('translated_title', sa.String, nullable=False),  # Translated title
    )

    # Adjustments to existing tables (auto-generated)
    op.drop_index('ix_products_new_product_id', table_name='products')
    op.drop_index('ix_products_new_search_value', table_name='products')
    op.drop_index('ix_products_new_title', table_name='products')
    op.create_index(op.f('ix_products_product_id'), 'products', ['product_id'], unique=False)
    op.create_index(op.f('ix_products_search_value'), 'products', ['search_value'], unique=False)
    op.create_index(op.f('ix_products_title'), 'products', ['title'], unique=False)
    op.alter_column('search_histories', 'search_id',
                    existing_type=sa.INTEGER(),
                    nullable=False,
                    autoincrement=True)
    op.drop_constraint(None, 'search_histories', type_='foreignkey')
    op.drop_constraint(None, 'search_histories', type_='foreignkey')
    op.create_foreign_key(None, 'search_histories', 'products', ['product_id'], ['product_id'], ondelete='SET NULL')
    op.create_foreign_key(None, 'search_histories', 'users', ['user_id'], ['user_id'], ondelete='CASCADE')
    op.alter_column('user_recommendations', 'recommendation_date',
                    existing_type=sa.DATETIME(),
                    nullable=True)
    op.drop_index('ix_user_recommendations_temp_recommendation_id', table_name='user_recommendations')
    op.create_index(op.f('ix_user_recommendations_recommendation_id'), 'user_recommendations', ['recommendation_id'], unique=False)


def downgrade() -> None:
    # Remove ProductTitleTranslation table
    op.drop_table('product_title_translations')

    # Adjustments to existing tables (auto-generated)
    op.drop_index(op.f('ix_user_recommendations_recommendation_id'), table_name='user_recommendations')
    op.create_index('ix_user_recommendations_temp_recommendation_id', 'user_recommendations', ['recommendation_id'], unique=False)
    op.alter_column('user_recommendations', 'recommendation_date',
                    existing_type=sa.DATETIME(),
                    nullable=False)
    op.drop_constraint(None, 'search_histories', type_='foreignkey')
    op.drop_constraint(None, 'search_histories', type_='foreignkey')
    op.create_foreign_key(None, 'search_histories', 'users', ['user_id'], ['user_id'])
    op.create_foreign_key(None, 'search_histories', 'products', ['product_id'], ['product_id'])
    op.alter_column('search_histories', 'search_id',
                    existing_type=sa.INTEGER(),
                    nullable=True,
                    autoincrement=True)
    op.drop_index(op.f('ix_products_title'), table_name='products')
    op.drop_index(op.f('ix_products_search_value'), table_name='products')
    op.drop_index(op.f('ix_products_product_id'), table_name='products')
    op.create_index('ix_products_new_title', 'products', ['title'], unique=False)
    op.create_index('ix_products_new_search_value', 'products', ['search_value'], unique=False)
    op.create_index('ix_products_new_product_id', 'products', ['product_id'], unique=False)

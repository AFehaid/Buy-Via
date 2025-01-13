"""Remove title_in_arabic column from products

Revision ID: be7547aa1e42
Revises: ad6695b190c8
Create Date: 2025-01-14 00:45:08.930071

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'be7547aa1e42'
down_revision = 'ad6695b190c8'
branch_labels = None
depends_on = None


def upgrade():
    # Workaround for SQLite: recreate the `products` table without `title_in_arabic`
    op.create_table(
        'products_new',
        sa.Column('product_id', sa.Integer, primary_key=True, index=True),
        sa.Column('title', sa.String, index=True, nullable=False),
        sa.Column('price', sa.Float, nullable=True),
        sa.Column('info', sa.String, nullable=True),
        sa.Column('search_value', sa.String, index=True),
        sa.Column('link', sa.String),
        sa.Column('image_url', sa.String),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE')),
        sa.Column('group_id', sa.Integer, sa.ForeignKey('product_groups.group_id', ondelete='SET NULL'), nullable=True),
        sa.Column('category_id', sa.Integer, sa.ForeignKey('categories.category_id', ondelete='SET NULL'), nullable=True),
        sa.Column('availability', sa.Boolean, default=True),
        sa.Column('last_updated', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Copy data from the old table to the new table
    op.execute("""
        INSERT INTO products_new (
            product_id, title, price, info, search_value, link, image_url,
            store_id, group_id, category_id, availability, last_updated
        )
        SELECT
            product_id, title, price, info, search_value, link, image_url,
            store_id, group_id, category_id, availability, last_updated
        FROM products
    """)

    # Drop the old table
    op.drop_table('products')

    # Rename the new table to the original table name
    op.rename_table('products_new', 'products')


def downgrade():
    # Recreate the `products` table with the `title_in_arabic` column
    op.create_table(
        'products_new',
        sa.Column('product_id', sa.Integer, primary_key=True, index=True),
        sa.Column('title', sa.String, index=True, nullable=False),
        sa.Column('title_in_arabic', sa.String, nullable=True),
        sa.Column('price', sa.Float, nullable=True),
        sa.Column('info', sa.String, nullable=True),
        sa.Column('search_value', sa.String, index=True),
        sa.Column('link', sa.String),
        sa.Column('image_url', sa.String),
        sa.Column('store_id', sa.Integer, sa.ForeignKey('stores.store_id', ondelete='CASCADE')),
        sa.Column('group_id', sa.Integer, sa.ForeignKey('product_groups.group_id', ondelete='SET NULL'), nullable=True),
        sa.Column('category_id', sa.Integer, sa.ForeignKey('categories.category_id', ondelete='SET NULL'), nullable=True),
        sa.Column('availability', sa.Boolean, default=True),
        sa.Column('last_updated', sa.DateTime, default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Copy data back from the current table to the new table
    op.execute("""
        INSERT INTO products_new (
            product_id, title, price, info, search_value, link, image_url,
            store_id, group_id, category_id, availability, last_updated
        )
        SELECT
            product_id, title, price, info, search_value, link, image_url,
            store_id, group_id, category_id, availability, last_updated
        FROM products
    """)

    # Drop the current table
    op.drop_table('products')

    # Rename the new table to the original table name
    op.rename_table('products_new', 'products')

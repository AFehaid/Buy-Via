"""Update user_recommendations table: add priority_score, remove reason

Revision ID: ad6695b190c8
Revises: 6deaa1afa788
Create Date: 2025-01-08 19:56:38.173358

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad6695b190c8'
down_revision: Union[str, None] = '6deaa1afa788'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create a temporary table with the updated schema
    op.create_table(
        'user_recommendations_temp',
        sa.Column('recommendation_id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='CASCADE')),
        sa.Column('recommendation_date', sa.DateTime, default=sa.func.now(), nullable=False),
        sa.Column('priority_score', sa.Float, nullable=False)  # New column
    )

    # Copy data from the old table to the new table, setting a default priority_score
    op.execute("""
        INSERT INTO user_recommendations_temp (
            recommendation_id, user_id, product_id, recommendation_date, priority_score
        )
        SELECT
            recommendation_id, user_id, product_id, recommendation_date, 0.0
        FROM user_recommendations
    """)

    # Drop the old table
    op.drop_table('user_recommendations')

    # Rename the temporary table to the original table name
    op.rename_table('user_recommendations_temp', 'user_recommendations')


def downgrade() -> None:
    # Create a temporary table with the old schema
    op.create_table(
        'user_recommendations_temp',
        sa.Column('recommendation_id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE')),
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='CASCADE')),
        sa.Column('recommendation_date', sa.DateTime, default=sa.func.now(), nullable=False),
        sa.Column('reason', sa.String, nullable=True)  # Old column
    )

    # Copy data back from the new table to the old table, leaving `reason` empty
    op.execute("""
        INSERT INTO user_recommendations_temp (
            recommendation_id, user_id, product_id, recommendation_date, reason
        )
        SELECT
            recommendation_id, user_id, product_id, recommendation_date, NULL
        FROM user_recommendations
    """)

    # Drop the new table
    op.drop_table('user_recommendations')

    # Rename the temporary table to the original table name
    op.rename_table('user_recommendations_temp', 'user_recommendations')

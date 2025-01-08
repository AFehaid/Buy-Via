from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision = '893a9e8148ef'
down_revision = 'ae3ac232bf21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Define the new table schema
    op.create_table(
        'search_histories_temp',
        sa.Column('search_id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE')),
        sa.Column('search_value', sa.String, nullable=True),  # Now nullable
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='SET NULL'), nullable=True),
        sa.Column('search_date', sa.DateTime, default=sa.func.now(), nullable=False),
    )

    # Copy data from old table to the new table
    op.execute("""
        INSERT INTO search_histories_temp (search_id, user_id, search_value, product_id, search_date)
        SELECT search_id, user_id, search_value, product_id, search_date
        FROM search_histories
    """)

    # Drop the old table and rename the new table
    op.drop_table('search_histories')
    op.rename_table('search_histories_temp', 'search_histories')


def downgrade() -> None:
    # Define the old table schema
    op.create_table(
        'search_histories_temp',
        sa.Column('search_id', sa.Integer, primary_key=True, index=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE')),
        sa.Column('search_value', sa.String, nullable=False),  # Not nullable
        sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='SET NULL'), nullable=True),
        sa.Column('search_date', sa.DateTime, default=sa.func.now(), nullable=False),
    )

    # Copy data back to the old schema
    op.execute("""
        INSERT INTO search_histories_temp (search_id, user_id, search_value, product_id, search_date)
        SELECT search_id, user_id, search_value, product_id, search_date
        FROM search_histories
        WHERE search_value IS NOT NULL
    """)

    # Drop the new table and rename the old table
    op.drop_table('search_histories')
    op.rename_table('search_histories_temp', 'search_histories')

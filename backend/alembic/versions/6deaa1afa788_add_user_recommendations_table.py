"""Add user_recommendations table

Revision ID: 6deaa1afa788
Revises: 893a9e8148ef
Create Date: 2025-01-08 16:29:23.278618

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '6deaa1afa788'
down_revision: Union[str, None] = '893a9e8148ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the user_recommendations table if it doesn't exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'user_recommendations' not in inspector.get_table_names():
        op.create_table(
            'user_recommendations',
            sa.Column('recommendation_id', sa.Integer, primary_key=True, index=True),
            sa.Column('user_id', sa.Integer, sa.ForeignKey('users.user_id', ondelete='CASCADE')),
            sa.Column('product_id', sa.Integer, sa.ForeignKey('products.product_id', ondelete='CASCADE')),
            sa.Column('recommendation_date', sa.DateTime, default=sa.func.now(), nullable=False),
            sa.Column('reason', sa.String, nullable=True),
        )

    # Handle altering `search_histories.search_date` for SQLite
    if isinstance(conn.dialect, sqlite.dialect):
        # SQLite does not support ALTER COLUMN, so we create a new table
        op.execute("""
            CREATE TABLE search_histories_new (
                search_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                search_value TEXT,
                product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
                search_date DATETIME
            )
        """)
        op.execute("""
            INSERT INTO search_histories_new (search_id, user_id, search_value, product_id, search_date)
            SELECT search_id, user_id, search_value, product_id, search_date
            FROM search_histories
        """)
        op.execute("DROP TABLE search_histories")
        op.execute("ALTER TABLE search_histories_new RENAME TO search_histories")
        op.create_index('ix_search_histories_search_id', 'search_histories', ['search_id'], unique=False)
    else:
        # For non-SQLite databases, use normal ALTER COLUMN
        op.alter_column(
            'search_histories',
            'search_date',
            existing_type=sa.DATETIME(),
            nullable=True
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'user_recommendations' in inspector.get_table_names():
        op.drop_table('user_recommendations')

    # Handle reverting `search_histories.search_date` for SQLite
    if isinstance(conn.dialect, sqlite.dialect):
        # SQLite does not support ALTER COLUMN, so we create a new table
        op.execute("""
            CREATE TABLE search_histories_new (
                search_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                search_value TEXT,
                product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
                search_date DATETIME NOT NULL
            )
        """)
        op.execute("""
            INSERT INTO search_histories_new (search_id, user_id, search_value, product_id, search_date)
            SELECT search_id, user_id, search_value, product_id, search_date
            FROM search_histories
        """)
        op.execute("DROP TABLE search_histories")
        op.execute("ALTER TABLE search_histories_new RENAME TO search_histories")
        op.create_index('ix_search_histories_search_id', 'search_histories', ['search_id'], unique=False)
    else:
        # For non-SQLite databases, use normal ALTER COLUMN
        op.alter_column(
            'search_histories',
            'search_date',
            existing_type=sa.DATETIME(),
            nullable=False
        )

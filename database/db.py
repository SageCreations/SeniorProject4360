import sqlite3
import os


# Chat History Functions ======================================================
def insert_chat_history() -> int:
    """Insert a new chat history record and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO chat_history (title) VALUES (NULL);")
        conn.commit()
        resp = cur.lastrowid
    finally:
        cur.close()
    return resp


def get_chat_histories() -> list[dict[str, str | int | None]]:
    """Return a list of all chat histories with id and title."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, title FROM chat_history;")
        rows = cur.fetchall()
    finally:
        cur.close()

    return [{"id": row[0], "title": row[1]} for row in rows]


def get_chat_history(hist_id: int) -> dict[str, str | int] | None:
    """Return a single chat history by its ID."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, title FROM chat_history WHERE id = ?;", (hist_id,))
        row = cur.fetchone()
    finally:
        cur.close()

    return {"id": row[0], "title": row[1]} if row else None


def update_chat_history(hist_id: int, new_title: str) -> None:
    """Update the title of a chat history."""
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE chat_history SET title = ? WHERE id = ?;",
            (new_title, hist_id),
        )
        conn.commit()
    finally:
        cur.close()


def delete_chat_history(hist_id: int) -> None:
    """Delete a chat history and its related chats and docs."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM chat_history WHERE id = ?;", (hist_id,))
        conn.commit()
    finally:
        cur.close()


# Chat Message Functions ======================================================
def insert_chat(message: str, order_number: int, hist_id: int, role: int) -> int:
    """Insert a new chat message and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO chat (message, order_number, chat_history_id, role)
            VALUES (?, ?, ?, ?);
            """,
            (message, order_number, hist_id, role),
        )
        conn.commit()
        resp = cur.lastrowid
    finally:
        cur.close()
    return resp


def get_chats_by_history(hist_id: int) -> list[dict[str, str | int]]:
    """Return all chat messages for a given chat history ID."""
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, message, order_number, chat_history_id, role "
            "FROM chat WHERE chat_history_id = ?;",
            (hist_id,),
        )
        rows = cur.fetchall()
    finally:
        cur.close()

    return [
        {
            "id": row[0],
            "message": row[1],
            "order_number": row[2],
            "chat_history_id": row[3],
            "role": row[4],
        }
        for row in rows
    ]


def update_chat(chat_id: int, new_message: str) -> int:
    """Update a chat message and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute("UPDATE chat SET message = ? WHERE id = ?;", (new_message, chat_id))
        conn.commit()
    finally:
        cur.close()
    return chat_id


def delete_chat(chat_id: int) -> int:
    """Delete a chat message by its ID."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM chat WHERE id = ?;", (chat_id,))
        conn.commit()
    finally:
        cur.close()
    return chat_id


def delete_chats_by_history(hist_id: int) -> int:
    """Delete all chat messages associated with a chat history."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM chat WHERE chat_history_id = ?;", (hist_id,))
        conn.commit()
    finally:
        cur.close()
    return hist_id


# Role Functions ==============================================================
def insert_role(role_name: str) -> int | None:
    """Insert a role if it does not exist and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute("INSERT OR IGNORE INTO role (role_name) VALUES (?);", (role_name,))
        conn.commit()
        cur.execute("SELECT id FROM role WHERE role_name = ?;", (role_name,))
        result = cur.fetchone()
    finally:
        cur.close()

    return result[0] if result else None


def get_roles() -> list[dict[str, str | int]]:
    """Return all available roles with their ID and name."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, role_name FROM role;")
        rows = cur.fetchall()
    finally:
        cur.close()

    return [{"id": row[0], "role_name": row[1]} for row in rows]


def update_role(role_id: int, new_name: str) -> int:
    """Update a role name and return the role ID."""
    cur = conn.cursor()
    try:
        cur.execute("UPDATE role SET role_name = ? WHERE id = ?;", (new_name, role_id))
        conn.commit()
    finally:
        cur.close()
    return role_id


def delete_role(role_id: int) -> int:
    """Delete a role by its ID."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM role WHERE id = ?;", (role_id,))
        conn.commit()
    finally:
        cur.close()
    return role_id


# Document Functions ==========================================================
def insert_doc(data_url: str, message: str, hist_id: int, chat_id: int) -> int:
    """Insert a new document and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute(
            """
            INSERT INTO docs (data_url, message, chat_history_id, chat_id)
            VALUES (?, ?, ?, ?);
            """,
            (data_url, message, hist_id, chat_id),
        )
        conn.commit()
        resp = cur.lastrowid
    finally:
        cur.close()
    return resp


def get_docs_by_history(hist_id: int) -> list[str]:
    """Return all document messages associated with a chat history."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT message FROM docs WHERE chat_history_id = ?;", (hist_id,))
        rows = cur.fetchall()
    finally:
        cur.close()

    return [row[0] for row in rows]


def get_docs_by_chat_id(chat_id: int) -> list[str]:
    """Return all document data_urls associated with a chat ID."""
    cur = conn.cursor()
    try:
        cur.execute("SELECT data_url FROM docs WHERE chat_id = ?;", (chat_id,))
        rows = cur.fetchall()
    finally:
        cur.close()

    return [row[0] for row in rows]


def update_doc(doc_id: int, new_message: str) -> int:
    """Update a document message and return its ID."""
    cur = conn.cursor()
    try:
        cur.execute("UPDATE docs SET message = ? WHERE id = ?;", (new_message, doc_id))
        conn.commit()
    finally:
        cur.close()
    return doc_id


def delete_docs_by_history(hist_id: int) -> None:
    """Delete all documents associated with a chat history."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM docs WHERE chat_history_id = ?;", (hist_id,))
        conn.commit()
    finally:
        cur.close()


# Cohere API Key Functions ====================================================
def update_cohere_key(new_key: str) -> None:
    """Update the stored Cohere API key (only one can exist)."""
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM cohere_key;")
        cur.execute("INSERT INTO cohere_key (key) VALUES (?);", (new_key,))
        conn.commit()
    finally:
        cur.close()


def get_cohere_key() -> str | None:
    cur = conn.cursor()
    try:
        cur.execute("SELECT key FROM cohere_key LIMIT 1")
        resp = cur.fetchone()
    finally:
        cur.close()
    
    if resp is None:
        return None

    return resp[0]


# DB Initialization ===========================================================
def init_db():
    cur = conn.cursor()
    try:
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS role (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_name TEXT UNIQUE NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT
            );

            CREATE TABLE IF NOT EXISTS docs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data_url TEXT,
                message TEXT,
                chat_history_id INTEGER,
                chat_id INTEGER,
                FOREIGN KEY (chat_history_id) REFERENCES chat_history(id) ON DELETE CASCADE,
                FOREIGN KEY (chat_id) REFERENCES chat(id)
            );

            CREATE TABLE IF NOT EXISTS chat (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT NOT NULL,
                order_number INTEGER NOT NULL,
                chat_history_id INTEGER NOT NULL,
                role INTEGER NOT NULL,
                FOREIGN KEY (chat_history_id) REFERENCES chat_history(id) ON DELETE CASCADE,
                FOREIGN KEY (role) REFERENCES role(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS cohere_key (
                key TEXT
            );
        """
        )
        conn.commit()
    finally:
        cur.close()

    user_role = insert_role("user")
    assist_role = insert_role("assistant")


# Globals =====================================================================
DB_PATH = os.path.join(os.path.dirname(__file__), "chatbot.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
init_db()


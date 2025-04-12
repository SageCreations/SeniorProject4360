import sqlite3
import os

# Filename for database "chatbot.db"

DB_PATH = os.path.join(os.path.dirname(__file__), "chatbot.db")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cur = conn.cursor()





# Funciton to insert chat history
def insert_chat_history():
    cur.execute(
        "INSERT INTO chat_history (title) VALUES (NULL);",
    )
    conn.commit()
    return cur.lastrowid


# Function to get chat histories
def get_chat_histories():
    cur.execute("SELECT * FROM chat_history;")
    return cur.fetchall()


# get a singular chat history back, use to get title
def get_chat_history(hist_id):
    cur.execute("SELECT id, title FROM chat_history WHERE id = ?;", (hist_id,))
    return cur.fetchone()


# Function to update chat history title
def update_chat_history(chat_history_id, new_title):
    cur.execute(
        "UPDATE chat_history SET title = ? WHERE id = ?;", (new_title, chat_history_id)
    )
    conn.commit()
    return chat_history_id


# Function to delete chat history by ID (will also delete related chat and docs due to CASCADE)
def delete_chat_history(chat_history_id):
    cur.execute("DELETE FROM chat_history WHERE id = ?;", (chat_history_id,))
    conn.commit()
    return chat_history_id


# Function to insert chat message
def insert_or_update_chat(message, order_number, chat_history_id, role):
    cur.execute(
        """
        INSERT INTO chat (message, order_number, chat_history_id, role)
        VALUES (?, ?, ?, ?);
    """,
        (message, order_number, chat_history_id, role),
    )
    conn.commit()
    return cur.lastrowid


# Function to get all chat messages for given chat history
def get_chats_by_history(chat_history_id):
    cur.execute("SELECT * FROM chat WHERE chat_history_id = ?;", (chat_history_id,))
    return cur.fetchall()


# Function to update a chat message
def update_chat(chat_id, new_message):
    cur.execute("UPDATE chat SET message = ? WHERE id = ?;", (new_message, chat_id))
    conn.commit()
    return chat_id


# Function to delete a chat message by ID
def delete_chat(chat_id):
    cur.execute("DELETE FROM chat WHERE id = ?;", (chat_id,))
    conn.commit()
    return chat_id


# Function to insert role if it doesn't exist
def insert_role(role_name):
    cur.execute("INSERT OR IGNORE INTO role (role_name) VALUES (?);", (role_name,))
    conn.commit()
    cur.execute("SELECT id FROM role WHERE role_name = ?;", (role_name,))
    result = cur.fetchone()
    return result[0] if result else None


# Function to get roles
def get_roles():
    cur.execute("SELECT * FROM role;")
    return cur.fetchall()


# Function to update role name
def update_role(role_id, new_role_name):
    cur.execute("UPDATE role SET role_name = ? WHERE id = ?;", (new_role_name, role_id))
    conn.commit()
    return role_id


# Function to delete a role by ID
def delete_role(role_id):
    cur.execute("DELETE FROM role WHERE id = ?;", (role_id,))
    conn.commit()
    return role_id

# function to insert new doc into table
def insert_doc(chat_history_id, message, role):
    cur.execute("INSERT INTO docs (chat_history_id, message, role) VALUES (?, ?, ?)", (chat_history_id, message, role))


# Function to get all documents for a given chat history
def get_docs_by_history(chat_history_id):
    cur.execute("SELECT * FROM docs WHERE chat_history_id = ?;", (chat_history_id,))
    return cur.fetchall()


# Function to update a document message
def update_doc(doc_id, new_message):
    cur.execute("UPDATE docs SET message = ? WHERE id = ?;", (new_message, doc_id))
    conn.commit()
    return doc_id


# Function to delete a document by ID
def delete_doc(hist_id):
    cur.execute("DELETE FROM docs WHERE chat_history_id = ?;", (hist_id,))
    conn.commit()
    return hist_id


# TODO: Remake the docs table to have the id for the user message 
#       as a foreign key rather than a role id (not used).
def init_db():
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
            chat_history_id INTEGER NOT NULL,
            message TEXT,
            role INTEGER NOT NULL,
            FOREIGN KEY (chat_history_id) REFERENCES chat_history(id) ON DELETE CASCADE,
            FOREIGN KEY (role) REFERENCES role(id) ON DELETE CASCADE
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
    """
    )
    conn.commit()

    user_role = insert_role("user")
    assist_role = insert_role("assistant")
    # print(f"user: {user_role}\nAssistant: {assist_role}")
    # hist_id = insert_chat_history()
    # update_chat_history(hist_id, "Main chat")


# Call init_db when the module is imported
init_db()



if __name__ == "__main__":
    # Only runs if dbmain.py is ran directly
    # Test insert
    role_name = "User"
    role_id = insert_role(role_name)
    chat_history_id = insert_chat_history()
    chat_id = insert_or_update_chat("Hello", 1, chat_history_id, role_id)

    # Print table structure
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()

    print("Tables in the database:")
    for table in tables:
        table_name = table[0]
        print(f"\n Table: {table_name}")
        cur.execute(f"PRAGMA table_info({table_name});")
        columns = cur.fetchall()
        if columns:
            print(" Columns:")
            for column in columns:
                print(f"    - {column[1]} ({column[2]})")
        else:
            print(" No columns found.")

# lines needed for test data
# cur.close()
# conn.close()
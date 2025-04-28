import os
import sys
import json
import base64
from webui import webui as ui
import cohere
import database.db as db
import OCR.ocr as ocr

# API KEY for testing
# baEFHZHrRfmJQFaKNwCRIUpQODvAi5OW272d2God


# Chat Functions ==============================================================
def generate_title_from_message(user_msg: str) -> str:
    """
    Create a short title based on the user's message.
    """
    system_message = (
        "Give a 1 to 5 word title based off of the user's message. "
        "Do not say anything else besides the title. "
        "If the user's message is empty, make a title up."
    )

    if not user_msg:
        user_msg = " "

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_msg},
    ]
    
    resp = db.get_cohere_key()
    if resp is not None:
        co = cohere.ClientV2(api_key=resp)
        res = co.chat(model="command-r-plus-08-2024", messages=messages)
        return res.message.content[0].text
    
    return "Error"


def generate_response_for_history(hist_id: int) -> str:
    """
    Generate a chat response based on the existing chat history and documents.
    """
    messages = [{"role": "system", "content": ""}]
    chat_log = db.get_chats_by_history(hist_id)

    for chat in chat_log:
        role = "user" if chat["role"] == 1 else "assistant"
        if chat["message"]:
            messages.append({"role": role, "content": chat["message"]})

    documents: list[str] = db.get_docs_by_history(hist_id)

    resp = db.get_cohere_key()
    if resp is not None:
        co = cohere.ClientV2(api_key=resp)
        res = co.chat(
            model="command-r-plus-08-2024",
            messages=messages,
            documents=documents,
        )
        db.insert_chat(
            message=res.message.content[0].text,
            order_number=1,
            hist_id=hist_id,
            role=2,
        )
        return res.message.content[0].text

    return "Error: You have not set up your API KEY yet."


def save_uploaded_docs(hist_id: int, chat_id: int, file_list: list[str]):
    """
    Process and save uploaded document files to the database.
    """
    for file in file_list:
        parts = file.split(",")
        data_url: str = parts[0] + "," + parts[1]
        base64_data = parts[1]
        file_type = data_url.split(";")[0].split(":")[1]
        

        width = int(parts[2]) if len(parts) > 2 else 612
        height = int(parts[3]) if len(parts) > 3 else 792

        decoded_data = base64.b64decode(base64_data)
        img = ocr.ImageInfo(
            file_data=decoded_data, file_type=file_type, height=height, width=width
        )
        doc_message: str = ocr.handle_image(img)

        db.insert_doc(data_url, doc_message, hist_id, chat_id)


def handle_chat_event(e: ui.Event):
    """
    Handle incoming chat event (message + files) from UI.
    """
    hist_id = e.get_int_at(0)
    user_msg = e.get_string_at(1)
    user_files = e.get_string_at(2)

    if user_msg == "":
        user_msg = " "

    file_list = user_files.split("|") if user_files else []

    if hist_id == -1:
        hist_id = db.insert_chat_history()
        db.update_chat_history(hist_id, generate_title_from_message(user_msg))

    chat_id = db.insert_chat(message=user_msg, order_number=1, hist_id=hist_id, role=1)

    if file_list and file_list != [""]:
        save_uploaded_docs(hist_id, chat_id, file_list)

    response = f"{hist_id}|{generate_response_for_history(hist_id)}"
    e.return_string(response)


# Database API Handlers for Frontend ===========================================
def get_chat_histories_event(e: ui.Event):
    hist_logs = db.get_chat_histories()
    result = {hist["id"]: {"title": hist["title"] or "Untitled"} for hist in hist_logs}
    e.return_string(json.dumps(result))


def get_title_for_history(e: ui.Event):
    hist_id = e.get_int_at(0)
    history = db.get_chat_history(hist_id)
    e.return_string(history["title"] if history else "No Title")


def delete_history_event(e: ui.Event):
    hist_id = e.get_int_at(0)
    db.delete_chat_history(hist_id)
    db.delete_chats_by_history(hist_id)


def get_messages_for_history(e: ui.Event):
    hist_id = e.get_int_at(0)
    chat_logs = db.get_chats_by_history(hist_id)

    chat_data = {
        chat["id"]: {
            "message": chat["message"],
            "order_number": chat["order_number"],
            "history_id": chat["chat_history_id"],
            "role_id": chat["role"],
        }
        for chat in chat_logs
    }

    e.return_string(json.dumps(chat_data))


def get_documents_for_chat(e: ui.Event):
    chat_id = e.get_int_at(0)
    doc_urls = db.get_docs_by_chat_id(chat_id)
    
    if len(doc_urls) > 1:
        resp = "|".join(doc_urls)
    elif len(doc_urls) == 1:
        resp = doc_urls[0]
    else:
        resp = ""
    
    e.return_string(resp)


def update_api_key(e: ui.Event):
    api_key = e.get_string_at(0)
    db.update_cohere_key(api_key)


def get_api_key(e: ui.Event):
    resp = db.get_cohere_key()
    if resp is None:
        e.return_string("")
    else:
        e.return_string(resp)


# =============================================================================


def main():
    my_window = ui.Window()

    # NOTE: Switch these paths when building executable
    my_window.set_root_folder("views")
    # my_window.set_root_folder("_internal/views")

    # Bind UI events
    my_window.bind("handleChat",    handle_chat_event)
    my_window.bind("getChats",      get_chat_histories_event)
    my_window.bind("getMessages",   get_messages_for_history)
    my_window.bind("getDocs",       get_documents_for_chat)
    my_window.bind("removeHistory", delete_history_event)
    my_window.bind("getTitle",      get_title_for_history)
    my_window.bind("updateKey",     update_api_key)
    my_window.bind("getKey",        get_api_key)

    my_window.show_browser("index.html", my_window.get_best_browser())
    ui.wait()


if __name__ == "__main__":
    main()

import os
import sys
import json
from webui import webui as ui
import cohere
import database.db as db

co = cohere.ClientV2(api_key="baEFHZHrRfmJQFaKNwCRIUpQODvAi5OW272d2God")


# Utility Functions ===========================================================
def convert_tuples_to_json(data, key_index=0, field_names=None):
    result = {}

    for tup in data:
        # Extract the key using key_index
        key = tup[key_index]
        # Collect all other values (all indices except key_index)
        values = [v for i, v in enumerate(tup) if i != key_index]

        if field_names:
            if len(field_names) != len(values):
                raise ValueError(
                    f"Field names length ({len(field_names)}) does not match number "
                    f"of tuple values ({len(values)}) for tuple {tup}"
                )
            # Create a dictionary mapping field names to values
            result[key] = dict(zip(field_names, values))
        else:
            # Keep the values as a list if no field names provided
            result[key] = values

    # Serialize the dictionary into a JSON string
    return json.dumps(result)

# =============================================================================

# Chat Request functions ======================================================

# create a history title for the database
def create_title(user_msg: str) -> str:
    # Define a system message
    system_message = "Give a 1 to 5 word title based off of the user's message. Do not say anything else besides the title."

    # Start with the system message
    messages = [{"role": "system", "content": system_message}]
    messages.append({"role": "user", "content": user_msg})
    
    res = co.chat(
        model="command-r-plus-08-2024",
        messages=messages
    )
    return res.message.content[0].text

# handle the chat message for the user
def handle_text(hist_id: int, docs: list[str]) -> str:
    # Define a system message
    system_message = ""

    # Start with the system message
    messages = [{"role": "system", "content": system_message}]

    chat_log = db.get_chats_by_history(hist_id)
    print(chat_log)

    # Add the conversation history in order. We assume that the new user query is the last item
    # in user_history if user_history is one element longer than bot_history.
    # for u, b in zip(user_history, bot_history):
    #     #print("user msg: ", u)
    #     if u != "":
    #         messages.append({"role": "user", "content": u})
    #     #print("asst. msg: ", b)
    #     if b != "":
    #         messages.append({"role": "assistant", "content": b})

    # If there's an extra user message (the current query without a bot reply yet), add it.
    # if len(user_history) > len(bot_history):
    #     messages.append({"role": "user", "content": user_history[-1]})

    for rowid, mesg, ord_num, hist_id, role_id in chat_log:
        if mesg != "":
            if role_id == 1:
                messages.append({"role": "user", "content": mesg})
            else:
                messages.append({"role": "assistant", "content": mesg})

    res = co.chat(
        model="command-r-plus-08-2024",
        messages=messages,
        documents=docs,
    )

    # add bot message to db
    db.insert_or_update_chat(
        message=res.message.content[0].text,
        order_number=1,
        chat_history_id=hist_id,
        role=2
    )

    return res.message.content[0].text


def convert_files_to_string(file_list: list[str]) -> list[str]:
    for file in file_list:
        metadata, base64_data = file.split(",")

        file_type = metadata.split(";")[0].split(":")[1]
        print(file_type)
        
    # TODO: use Boyce's function here to return the list[str] his function returns
    return [] 


def handle_chat(e: ui.Event):
    hist_id = e.get_int_at(0)
    user_str = e.get_string_at(1)
    user_files_str = e.get_string_at(2)

    # Create new history if -1
    if hist_id == -1:
        hist_id = db.insert_chat_history()
        db.update_chat_history(hist_id, create_title(user_str))
    
    # add user message to db
    db.insert_or_update_chat(
        message=user_str, 
        order_number=1, 
        chat_history_id=hist_id,
        role=1
    )

    doc_list: list[str] = []  #convert_files_to_string(file_list)

    resp = f"{hist_id}|{handle_text(hist_id, doc_list)}"
    e.return_string(resp)



# middle man api for database backend for frontend use.
# =============================================================================
def get_histories(e: ui.Event):
    hist_logs = db.get_chat_histories()
    print(hist_logs)
    json_str = convert_tuples_to_json(hist_logs, key_index=0, field_names=['title'])

    e.return_string(json_str)

def get_title(e: ui.Event):
    hist_id = e.get_int_at(0)
    resp = db.get_chat_history(hist_id)
    e.return_string(resp[1])

def delete_history(e: ui.Event):
    hist_id = e.get_int_at(0)
    row_id = db.delete_chat_history(hist_id)


def get_chats_from_hist(e: ui.Event):
    hist_id = e.get_int_at(0)
    
    chat_logs = db.get_chats_by_history(hist_id)
    
    json_str = convert_tuples_to_json(chat_logs, key_index=0, field_names=['message', "order_number", "history_id", "role_id"])
    e.return_string(json_str)



# =============================================================================



def main():
    # if os.path.exists(db.DB_PATH):
    #     print(f"'db' exists.")
    # else:
    #     print(f"'db' does not exist.")
    
    my_window = ui.Window()
    my_window.set_root_folder("views")

    my_window.bind("handleChat", handle_chat)
    my_window.bind("getChats", get_histories)
    my_window.bind("getMessages", get_chats_from_hist)
    my_window.bind("removeHistory", delete_history)
    my_window.bind("getTitle", get_title)

    my_window.show_browser("index.html", my_window.get_best_browser())
    ui.wait()

if __name__ == "__main__":
    main()

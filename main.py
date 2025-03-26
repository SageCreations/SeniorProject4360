from webui import webui as ui
import cohere

co = cohere.ClientV2(api_key="baEFHZHrRfmJQFaKNwCRIUpQODvAi5OW272d2God")

def handle_text(user_history: list[str], bot_history: list[str]) -> str:
    # Define a system message
    system_message = ""

    # Start with the system message
    messages = [{"role": "system", "content": system_message}]

    # Add the conversation history in order. We assume that the new user query is the last item
    # in user_history if user_history is one element longer than bot_history.
    for u, b in zip(user_history, bot_history):
        print("user msg: ", u)
        if u != "":
            messages.append({"role": "user", "content": u})
        print("asst. msg: ", b)
        if b != "":
            messages.append({"role": "assistant", "content": b})

    # If there's an extra user message (the current query without a bot reply yet), add it.
    if len(user_history) > len(bot_history):
        messages.append({"role": "user", "content": user_history[-1]})

    res = co.chat(
        model="command-r-plus-08-2024",
        messages=messages,
    )

    return res.message.content[0].text


def handle_chat(e: ui.Event):
    user_str = e.get_string_at(0)
    bot_str = e.get_string_at(1)

    user_history: list = user_str.split("|")
    bot_history: list = bot_str.split("|")

    e.return_string(handle_text(user_history, bot_history))


def main():
    my_window = ui.Window()
    my_window.set_root_folder("views")

    my_window.bind("handleChat", handle_chat)

    my_window.show_browser("index.html", my_window.get_best_browser())
    ui.wait()

if __name__ == "__main__":
    main()

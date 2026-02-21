# Chatbot (Gemini + feedback) setup

The support chatbot uses Google Gemini and stores feedback in the backend database.

## 1. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create or select a project, then **Create API key**
3. Copy the key

## 2. Configure the backend

In the **backend** folder, create or edit `.env` and add:

```
GEMINI_API_KEY=your_api_key_here
```

Optional: if the default model fails with a "model not found" error, try setting a specific model:

```
GEMINI_MODEL=gemini-pro
```

(The backend tries `gemini-2.0-flash`, then `gemini-1.5-flash-latest`, then `gemini-1.5-flash`, then `gemini-pro` by default.)

Restart the Flask server after changing `.env`.

## 3. Install backend dependency

From the project root:

```bash
cd backend
pip install -r requirements.txt
```

This installs `google-generativeai`. The first time you run the backend after adding the model, the `support_feedback` table will be created automatically.

## 4. What the chatbot does

- **Help**: Answers questions about file formats (sensor → JSON/CSV/Excel/PDF, bank statement → PDF/CSV/Excel/JSON), loans, finance basics, and how to use the app. It does not reveal internal structure.
- **Feedback**: Users can open “Send feedback / complaint / rating” in the chat panel. Submissions are stored in the backend database (table `support_feedback`).

## 5. Viewing feedback

Feedback is stored in the Flask app’s SQLite database by default (`backend/instance/krishimitra.db`). You can inspect the `support_feedback` table with any SQLite client, or add a simple admin route later to list entries.

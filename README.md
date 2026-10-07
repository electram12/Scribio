
  # Scribio

  Scribio is a study and exam preparation app.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Admin decision emails

  Admin approval and denial notifications use EmailJS. After signing in as admin, enter the Service ID, Template ID, and Public Key in the EmailJS settings section and save them. These settings are stored in that browser's localStorage, so configure each browser that will send notifications.

  Set the EmailJS template's recipient address to `{{to_email}}`. Available template parameters include `to_name`, `user_name`, `user_email`, `school`, `status`, `decision`, and `message`. Use the EmailJS Public Key only; never enter a private key. Failed notifications can be retried from the affected user's row.

  ## Exam Marker AI

  Exam Marker sends the supplied question, marking scheme, optional answer, and uploaded images to Groq's hosted Qwen3.8 27B vision model for question-specific explanations and practice marking. Create a Groq API key and set `GROQ_API_KEY` in the root `.env.local` file for local development. The Vite development server reads this key on the server; it is not exposed to the browser.

  Production deployments must provide `GROQ_API_KEY` as a server-side environment variable and support the `/api/exam-marker` serverless route in `api/exam-marker.ts` (for example, Vercel). Do not use a `VITE_` prefix for the key. Groq's free access has rate limits shared across all app users. Users should remove names or other personal details from uploads before sending them.
  
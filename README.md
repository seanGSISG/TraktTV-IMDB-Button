# Trakt.tv Buttons for IMDb and Google Search

This userscript adds Trakt.tv functionality to both IMDb and Google search pages. It is designed to work with popular userscript managers such as **Tampermonkey**, **Violentmonkey**, or **Greasemonkey**.

- **On IMDb Title Pages:**  
  Two buttons are added in the Genre section:
  - **Open Trakt:** Opens the corresponding Trakt.tv page for the IMDb title.
  - **Add to List:** Adds the title to your custom Trakt.tv list (by default, "watchlist").

- **On Google Search Pages:**  
  When you search on Google and your query starts with a trigger:
  - `!m ` indicates a movie search.
  - `!t ` indicates a TV show search.
  
  The script then adds two buttons at the top of the search results:
  - **Open Trakt Search:** Opens Trakt.tv’s search page for your query.
  - **Add Top Result to List:** Searches Trakt for the top result and adds that movie or show to your custom list.

## Installation

1. **Install a Userscript Manager:**  
   Make sure you have a userscript manager installed in your browser. Some popular options include:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/)
   - [Greasemonkey](https://www.greasespot.net/)

2. **Install the Script:**  
   - Go to the [GitHub repository](https://github.com/your-repo-link) for this script.
   - Click the **"Raw"** button to view the raw version of the script.
   - Your userscript manager should prompt you to install the script. Follow the instructions to complete the installation.

## Configuration

Before using the script, you must obtain your own Trakt.tv credentials and configure the script with your information.

### 1. Obtain Your Trakt.tv Credentials

1. **Create or Log In to Your Trakt.tv Account:**  
   Visit [Trakt.tv](https://trakt.tv/) and sign up or log in.

2. **Register a New OAuth Application:**  
   - Navigate to [Trakt.tv OAuth Applications](https://trakt.tv/oauth/applications).
   - Click **Create New Application**.
   - Fill in the application details:
     - **Name:** (e.g., "Tampermonkey Trakt Script")
     - **Redirect URI:**  
       For device authentication, enter:
       ```
       urn:ietf:wg:oauth:2.0:oob
       ```
       (Place this on its own line, without any query strings.)
     - **JavaScript (CORS) Origins:**  
       If you plan to use a browser-based OAuth flow, add your website’s origin (e.g., `https://www.imdb.com`) on its own line. For device authentication, you can leave this blank.
   - After submitting, you will see a **Client ID** and a **Client Secret**. **Keep these private.**

3. **Obtain an Access Token via Device Authentication:**

   - **Request a Device Code:**  
     Use a tool like [Postman](https://www.postman.com/) or your browser’s developer console to make a POST request to:
     ```
     https://api.trakt.tv/oauth/device/code
     ```
     with the following JSON payload (replace `YOUR_CLIENT_ID`):
     ```json
     {
       "client_id": "YOUR_CLIENT_ID"
     }
     ```
     The response will include:
     - `device_code`
     - `user_code` (e.g., "7162CF09")
     - `verification_url` (typically `https://trakt.tv/activate`)
     - `expires_in` and `interval`

   - **Authorize Your Application:**  
     Open the `verification_url` in your browser and enter the `user_code` when prompted.

   - **Poll for the Access Token:**  
     After authorizing, make a POST request to:
     ```
     https://api.trakt.tv/oauth/device/token
     ```
     with the following payload (replace placeholders):
     ```json
     {
       "code": "YOUR_DEVICE_CODE",
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
     }
     ```
     Poll this endpoint every few seconds (as specified by the `interval`) until you receive a response that includes an `access_token`.

### 2. Configure the Script

Open the Tampermonkey script and replace the following placeholders in the configuration section:

- `YOUR_CLIENT_ID` – with your Trakt.tv Client ID.
- `YOUR_ACCESS_TOKEN` – with the access token you obtained.
- `YOUR_USERNAME` – with your Trakt.tv username.

For example:
```js
const TRAKT_CLIENT_ID = 'YOUR_CLIENT_ID';
const TRAKT_API_VERSION = 2;
const TRAKT_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
const TRAKT_USERNAME = 'YOUR_USERNAME';
const DEFAULT_LIST_SLUG = 'watchlist';
```

## Usage

### On IMDb Pages:
Visit an IMDb title page (e.g., [https://www.imdb.com/title/tt0110912/](https://www.imdb.com/title/tt0110912/)). Two buttons will appear in the Genre Chips section:
- **Open Trakt:** Opens the corresponding Trakt.tv page.
- **Add to List:** Adds the title (assumed to be a movie) to your custom list.

### On Google Search Pages:
When you perform a search on Google, include one of the triggers at the beginning of your query:
- Use **!m** for movie searches (e.g., `!m Pulp Fiction`).
- Use **!t** for TV show searches (e.g., `!t The Sopranos`).

The script will add two buttons at the top of the search results:
- **Open Trakt Search:** Opens Trakt.tv’s search page with your query.
- **Add Top Result to List:** Searches Trakt for the top result (movie or TV show based on the trigger) and adds it to your custom list.

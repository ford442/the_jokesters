import os
import paramiko

# --- Configuration ---
HOSTNAME = "test.1ink.us"
# --- Please fill in your username and password ---
USERNAME = "your_username"
PASSWORD = "your_password"
# -------------------------------------------------
REMOTE_DIR = "/the-jokesters/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/"
LOCAL_DIR = "projects/the_jokesters/public/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/"

def upload_files():
    """
    Uploads model files to the SFTP server.
    """
    transport = None
    sftp = None
    try:
        # --- Connect to the SFTP server ---
        transport = paramiko.Transport((HOSTNAME, 22))
        transport.connect(username=USERNAME, password=PASSWORD)
        sftp = paramiko.SFTPClient.from_transport(transport)
        print(f"Connected to {HOSTNAME}.")

        # --- Create remote directory if it doesn't exist ---
        try:
            sftp.stat(REMOTE_DIR)
        except FileNotFoundError:
            print(f"Creating remote directory: {REMOTE_DIR}")
            sftp.mkdir(REMOTE_DIR)

        # --- List local files ---
        local_files = os.listdir(LOCAL_DIR)
        if not local_files:
            print(f"No files found in {LOCAL_DIR}. Please make sure you have downloaded the model files.")
            return

        print(f"Found {len(local_files)} files to upload.")

        # --- Upload files ---
        for filename in local_files:
            local_path = os.path.join(LOCAL_DIR, filename)
            remote_path = os.path.join(REMOTE_DIR, filename)
            if os.path.isfile(local_path):
                print(f"Uploading {local_path} to {remote_path}...")
                sftp.put(local_path, remote_path)

        print("\n✅ Upload complete!")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        if sftp:
            sftp.close()
        if transport:
            transport.close()
        print("Connection closed.")

if __name__ == "__main__":
    upload_files()

import os
import paramiko
import getpass
from stat import S_ISDIR

# --- Server Configuration ---
HOSTNAME = "1ink.us"
PORT = 22  
USERNAME = "ford442"

# --- Project Configuration ---
# Local directory to upload
LOCAL_DIRECTORY = "models/onnx"

# Remote directory (Must be relative to your SFTP 'home' or an absolute path)
REMOTE_DIRECTORY = "test.1ink.us/the-jokesters/models/supertonic"

def create_remote_dir_recursive(sftp, remote_path):
    """
    Recursively checks and creates directories on the remote server
    similar to 'mkdir -p'.
    """
    dirs = remote_path.split('/')
    path = ""
    for directory in dirs:
        if not directory: continue # skip empty strings from leading/trailing slashes
        path = os.path.join(path, directory) if path else directory
        
        try:
            sftp.stat(path)
        except IOError:
            # Path doesn't exist, create it
            print(f"📁 Creating missing remote directory: {path}")
            try:
                sftp.mkdir(path)
            except IOError as e:
                print(f"⚠️ Could not create {path}. Check permissions or parent path. Error: {e}")

def upload_directory(sftp_client, local_path, remote_path):
    """
    Recursively uploads a directory and its contents to the remote server.
    """
    # Ensure the target directory structure exists before uploading
    create_remote_dir_recursive(sftp_client, remote_path)

    for item in os.listdir(local_path):
        local_item_path = os.path.join(local_path, item)
        # Using forward slashes for remote paths regardless of OS
        remote_item_path = f"{remote_path}/{item}"

        if os.path.isfile(local_item_path):
            print(f"⬆️ Uploading: {item}")
            try:
                sftp_client.put(local_item_path, remote_item_path)
            except Exception as e:
                print(f"❌ Failed to upload {item}: {e}")
                
        elif os.path.isdir(local_item_path):
            # Recurse
            upload_directory(sftp_client, local_item_path, remote_item_path)

def main():
    password = 'GoogleBez12!' 

    transport = None
    sftp = None
    try:
        transport = paramiko.Transport((HOSTNAME, PORT))
        print("🔌 Connecting to server...")
        transport.connect(username=USERNAME, password=password)
        print("✅ Connection successful!")

        sftp = paramiko.SFTPClient.from_transport(transport)
        
        # Verify local dir exists
        if not os.path.exists(LOCAL_DIRECTORY):
            print(f"❌ Error: Local directory '{LOCAL_DIRECTORY}' not found.")
            return

        print(f"🚀 Starting upload...")
        upload_directory(sftp, LOCAL_DIRECTORY, REMOTE_DIRECTORY)

        print("\n✅ Deployment complete!")

    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if sftp: sftp.close()
        if transport: transport.close()
        print("🔌 Connection closed.")

if __name__ == "__main__":
    main()

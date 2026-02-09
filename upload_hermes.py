import os
import paramiko
from stat import S_ISDIR

# Creds from deploy.py/deploy_models.py
HOSTNAME = "1ink.us"
PORT = 22
USERNAME = "ford442"
PASSWORD = 'GoogleBez12!'

# Paths
LOCAL_DIRECTORY = "public/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC"
REMOTE_DIRECTORY = "test.1ink.us/the-jokesters/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC"


def create_remote_dir_recursive(sftp, remote_path):
    dirs = remote_path.split('/')
    path = ""
    for directory in dirs:
        if not directory:
            continue
        path = os.path.join(path, directory) if path else directory
        try:
            sftp.stat(path)
        except IOError:
            print(f"📁 Creating: {path}")
            sftp.mkdir(path)


def upload_directory(sftp_client, local_path, remote_path):
    create_remote_dir_recursive(sftp_client, remote_path)
    for item in os.listdir(local_path):
        local_item = os.path.join(local_path, item)
        remote_item = f"{remote_path}/{item}"
        if os.path.isfile(local_item):
            print(f"⬆️ {item}")
            sftp_client.put(local_item, remote_item)
        elif os.path.isdir(local_item):
            upload_directory(sftp_client, local_item, remote_item)


def main():
    if not os.path.exists(LOCAL_DIRECTORY):
        print(f"❌ '{LOCAL_DIRECTORY}' missing")
        return
    transport = paramiko.Transport((HOSTNAME, PORT))
    transport.connect(username=USERNAME, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)
    print("🔌 Connected")
    upload_directory(sftp, LOCAL_DIRECTORY, REMOTE_DIRECTORY)
    print("✅ Done")
    sftp.close()
    transport.close()


if __name__ == "__main__":
    main()

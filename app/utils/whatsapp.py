import os
import requests

# URL Node.js WA Server Lokal
WA_API_URL = "http://localhost:5011"

def send_whatsapp_message(to_number, message_text):
    """
    Kirim pesan teks via Local Node.js WhatsApp Web API.
    """
    url = f"{WA_API_URL}/send-message"
    data = {
        "to": to_number,
        "text": message_text
    }
    
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        print(f"Pesan berhasil dikirim ke {to_number}")
        return True
    except requests.exceptions.RequestException as e:
        print(f"Gagal mengirim pesan ke {to_number}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        return False

def send_whatsapp_document(to_number, document_path, filename, caption=""):
    """
    Kirim file dokumen (misalnya Excel) via Local Node.js WhatsApp Web API.
    """
    url = f"{WA_API_URL}/send-document"
    
    data = {
        "to": to_number,
        "caption": caption,
        "filename": filename
    }
    
    try:
        with open(document_path, 'rb') as f:
            files = {
                'file': (os.path.basename(document_path), f)
            }
            response = requests.post(url, data=data, files=files)
            response.raise_for_status()
            print(f"Dokumen berhasil dikirim ke {to_number}")
            return True
    except requests.exceptions.RequestException as e:
        print(f"Gagal mengirim dokumen ke {to_number}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(e.response.text)
        return False

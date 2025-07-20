1. Start Redis Server:
----------------------
redis-server

2. Add .env
----------
 cp .env-example .env

3. pip install -r requirements.txt

4. pip install uvicorn

5. Start Web Socket:
--------------------
uvicorn server:app --host 127.0.0.1 --port 5001

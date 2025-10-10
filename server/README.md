npm run dev
npm run seed

1. Login:
---------
curl -X 'POST' 'http://localhost:8000/api/v1/auth/signin' -H 'accept: application/json' -H 'Content-Type: application/json' -d '{ "email": "suguna@hexitetechnologies.com", "password": "Password@2025" }'

2. Make Call:
-------------
curl -X 'POST' 'http://localhost:8000/api/v1/phone/make_call' -H 'accept: application/json' -H 'Authorization: Bearer ' -H 'Content-Type: application/json' -d '{
"phone_number": "+919499001032",
"instructions": "You are a sales representative calling to schedule an appointment.",
"first_message": "Hello, this is Sarah calling from ABC Company. How are you today?" }'

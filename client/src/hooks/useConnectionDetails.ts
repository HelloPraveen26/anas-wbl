import { useCallback, useEffect, useState } from 'react';
import { ConnectionDetails } from '@/app/api/connection-details/route';

export default function useConnectionDetails() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details',
      window.location.origin
    );

    fetch("https://voice.zenxai.io/api/v1/assistants/connection-details", {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNDEzM2UxZS00MzI2LTRlMjQtOTM3MS1iOTZhMWMyM2I5ZDEiLCJlbWFpbCI6InN1Z3VuYUBoZXhpdGV0ZWNobm9sb2dpZXMuY29tIiwiZmlyc3ROYW1lIjoiU2VsdmFtIiwibGFzdE5hbWUiOiJSYW0iLCJpYXQiOjE3NTQ1MDM2MjUsImV4cCI6MTc1NTEwODQyNX0.vTm_c3MtGz2xT_qWnpf9WkbUHDpG2fMznfpiuYuSzQY`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        console.error('Error fetching connection details:', error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}


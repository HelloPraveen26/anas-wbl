import { ApiProperty } from '@nestjs/swagger';

export class ConnectionDetailsResponseDto {
  @ApiProperty({
    description: 'LiveKit server WebSocket URL',
    example: 'wss://livekit.zenxai.io/',
  })
  serverUrl: string;

  @ApiProperty({
    description: 'LiveKit room name',
    example: 'voice_assistant_room_8658',
  })
  roomName: string;

  @ApiProperty({
    description: 'JWT token for participant authentication',
    example:
      'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidXNlciIsInZpZGVvIjp7InJvb20iOiJ2b2ljZV9hc3Npc3RhbnRfcm9vbV84NjU4Iiwicm9vbUpvaW4iOnRydWUsImNhblB1Ymxpc2giOnRydWUsImNhblB1Ymxpc2hEYXRhIjp0cnVlLCJjYW5TdWJzY3JpYmUiOnRydWV9LCJpc3MiOiJkZXZrZXkiLCJleHAiOjE3NTQ0NTAyMjUsIm5iZiI6MCwic3ViIjoidm9pY2VfYXNzaXN0YW50X3VzZXJfNDc5MSJ9.jHsZetGaLzKaIlbhtq7x8Y3MC8Ab7x-HqKy5TMZBlLQ',
  })
  participantToken: string;

  @ApiProperty({
    description: 'Participant display name',
    example: 'user',
  })
  participantName: string;
}

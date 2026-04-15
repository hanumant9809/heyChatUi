## Multi-Tab Chat Debugging Checklist

### Issue Summary
- User joins same room in two tabs
- Messages sent from Tab 1 are not received in Tab 2
- Backend reports `userCount: 1` even with 2 users

### Frontend Fixes Applied ✅
- ✅ Fixed `Stomp.over()` to use factory function
- ✅ Added subscription error handler
- ✅ Improved logging for message flow

### Backend Verification Checklist

**1. Message Publishing Check**
- [ ] Verify backend publishes to `/topic/rooms/{roomId}` (NOT `/topic/room/{roomId}`)
- [ ] Ensure message format matches:
  ```json
  {
    "roomId": "12346",
    "sender": "John",
    "content": "message text",
    "timestamp": "2026-04-15T10:30:00Z"
  }
  ```

**2. WebSocket Broadcast Check**
- [ ] Verify `@SendTo` annotation on message controller
- [ ] Example:
  ```java
  @MessageMapping("/sendMessage/{roomId}")
  @SendTo("/topic/rooms/{roomId}")
  public Message sendMessage(@DestinationVariable String roomId, Message message) {
    return message; // or process and return
  }
  ```

**3. User Tracking Check**
- [ ] Check if `/room/join` endpoint properly increments user count
- [ ] Verify database/cache is tracking all users in room
- [ ] Check if multiple connections from same IP/browser are counted separately

**4. Browser Console Verification**

**Tab 1:**
```
ChatService: Sending message to: /app/sendMessage/76867685 {roomId: '76867685', sender: 'samay', content: 'hie', ...}
```

**Tab 2:**
Should show EITHER:
- `ChatService: Received message from topic: /topic/rooms/76867685 {...}` (if message comes through)
- OR: `ChatService: Subscription error for topic: /topic/rooms/76867685 {...}` (if there's a subscription error)

### Network Debugging Steps

**1. Check WebSocket Connection**
```javascript
// In browser console on Tab 2:
// You should see an open WebSocket connection to ws://localhost:8080/hey-chat/api/chat/...
```

**2. Monitor Network Tab**
- Open DevTools → Network → WS (WebSocket filter)
- Send message from Tab 1
- Watch for message frame appearing in Tab 2's WebSocket connection
- If no message appears, backend isn't broadcasting

**3. Test Backend Directly (if possible)**
```bash
# From Terminal, test publish to topic
# (This depends on your backend framework)
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Messages not appearing in other tab | Backend not broadcasting to topic | Check `@SendTo` annotation, verify topic name |
| `userCount: 1` with 2 users | User tracking not working | Check `/room/join` endpoint implementation |
| Subscription shows no error but no messages | Topic name mismatch | Frontend uses `/topic/rooms/{roomId}`, verify backend uses same |
| Both tabs show receiving their own messages only | Messages echo back instead of broadcast | Check if message is sent back to sender only |

### Quick Test

1. **Tab 1:**
   - Join room "test-123"
   - Send message "Hello"

2. **Tab 2 Console Output Should Show:**
   ```
   ChatService: Received message from topic: /topic/rooms/test-123 {sender: "samay", content: "Hello", ...}
   ChatPage: Received message: {sender: "samay", content: "Hello", ...}
   ```

3. **If you see this output** → Frontend is working correctly, issue is backend message broadcasting
4. **If you DON'T see this output** → Check backend publish configuration

### Next Steps

1. First, run this test with the fixed ChatService
2. Check browser console for any error messages (not just console.log)
3. Verify backend `@SendTo("/topic/rooms/{roomId}")` is configured correctly
4. If still not working, share backend controller code for message endpoint

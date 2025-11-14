import crypto from 'crypto';

// In-memory store for demo purposes
const sessions = new Map();

export function startSupportSession(req, res){
  const { name, initialMessage } = req.body || {};
  const id = crypto.randomBytes(6).toString('hex');
  const session = { id, name: name || 'Guest', createdAt: new Date(), messages: [] , clients: [] };
  if(initialMessage) session.messages.push({ from: 'user', text: initialMessage, ts: new Date() });
  sessions.set(id, session);
  res.json({ success: true, sessionId: id });
}

export function postSupportMessage(req, res){
  const { sessionId, from, message } = req.body || {};
  if(!sessionId || !message) return res.status(400).json({ error: 'Missing sessionId or message' });
  const session = sessions.get(sessionId);
  if(!session) return res.status(404).json({ error: 'Session not found' });
  const msg = { from: from || 'user', text: message, ts: new Date() };
  session.messages.push(msg);
  // broadcast to SSE clients
  session.clients.forEach((client) => {
    try{ client.res.write(`event: message\ndata:${JSON.stringify(msg)}\n\n`); }catch(e){}
  });
  res.json({ success: true });
}

export function streamSupportMessages(req, res){
  const sessionId = req.params.sessionId;
  if(!sessionId) return res.status(400).end();
  const session = sessions.get(sessionId);
  if(!session) return res.status(404).end();

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('\n');

  // Send existing messages
  session.messages.forEach((m)=>{
    res.write(`event: message\ndata:${JSON.stringify(m)}\n\n`);
  });

  const client = { id: crypto.randomBytes(4).toString('hex'), res };
  session.clients.push(client);

  req.on('close', () => {
    // remove client
    session.clients = session.clients.filter(c=>c.id !== client.id);
  });
}

export function listSessions(req, res){
  const arr = Array.from(sessions.values()).map(s=>({ id: s.id, name: s.name, createdAt: s.createdAt, lastMessage: s.messages[s.messages.length-1]||null }));
  res.json(arr);
}

export function getSessionMessages(req, res){
  const sessionId = req.params.sessionId;
  const session = sessions.get(sessionId);
  if(!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session.messages);
}

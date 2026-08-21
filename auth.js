// ============================================================================
// AUTENTICAÇÃO E CONTROLE DE ACESSO
// ============================================================================

const AUTH_LS = 'carvao360_auth';
const USERS_LS = 'carvao360_users';

// Tipos de usuário e permissões
const ROLES = {
  admin: { nome: 'Administrador', perms: ['*'] },
  gerente: { nome: 'Gerente', perms: ['view_all', 'create', 'edit', 'delete', 'relatorio', 'audit', 'export'] },
  operador: { nome: 'Operador', perms: ['view_own', 'create', 'edit_own', 'relatorio'] },
  vendedor: { nome: 'Vendedor', perms: ['view_clientes', 'create_clientes', 'edit_clientes', 'relatorio'] }
};

let currentUser = null;

// Inicializar usuários padrão
function initUsers() {
  let users = JSON.parse(localStorage.getItem(USERS_LS));
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = [
      {
        id: 1,
        nome: 'Administrador',
        email: 'admin@carvao360.com',
        senha: hashPassword('admin123'),
        role: 'admin',
        ativo: true,
        criadoEm: new Date().toISOString()
      }
    ];
    localStorage.setItem(USERS_LS, JSON.stringify(users));
  }
  return users;
}

// Hash simples (em produção usar bcrypt)
function hashPassword(pwd) {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36);
}

// Login
function login(email, senha) {
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_LS));
  const user = users.find(u => u.email === email && u.ativo);
  
  if (!user || user.senha !== hashPassword(senha)) {
    return { ok: false, erro: 'Email ou senha inválidos' };
  }
  
  const token = 'tk_' + Date.now() + '_' + Math.random().toString(36).substr(2);
  const session = {
    token,
    userId: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    loginEm: new Date().toISOString(),
    expiremEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
  };
  
  localStorage.setItem(AUTH_LS, JSON.stringify(session));
  currentUser = session;
  return { ok: true, user: session };
}

// Logout
function logout() {
  localStorage.removeItem(AUTH_LS);
  currentUser = null;
}

// Restaurar sessão
function restoreSession() {
  const auth = localStorage.getItem(AUTH_LS);
  if (auth) {
    try {
      const session = JSON.parse(auth);
      if (new Date(session.expiremEm) > new Date()) {
        currentUser = session;
        return true;
      }
    } catch (e) {}
  }
  return false;
}

// Verificar permissão
function hasPermission(perm) {
  if (!currentUser) return false;
  const role = ROLES[currentUser.role];
  if (!role) return false;
  if (role.perms.includes('*')) return true;
  return role.perms.includes(perm);
}

// Criar usuário (admin only)
function createUser(nome, email, senha, role) {
  if (!hasPermission('*')) return { ok: false, erro: 'Sem permissão' };
  
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_LS));
  
  if (users.find(u => u.email === email)) {
    return { ok: false, erro: 'Email já cadastrado' };
  }
  
  const user = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    nome,
    email,
    senha: hashPassword(senha),
    role: role || 'operador',
    ativo: true,
    criadoEm: new Date().toISOString()
  };
  
  users.push(user);
  localStorage.setItem(USERS_LS, JSON.stringify(users));
  audit('user_created', `Usuário ${user.nome} criado`, { userId: user.id });
  
  return { ok: true, user };
}

// Listar usuários
function listUsers() {
  if (!hasPermission('*')) return [];
  initUsers();
  return JSON.parse(localStorage.getItem(USERS_LS)).map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    criadoEm: u.criadoEm
  }));
}

// Deletar usuário
function deleteUser(userId) {
  if (!hasPermission('*')) return { ok: false, erro: 'Sem permissão' };
  
  initUsers();
  const users = JSON.parse(localStorage.getItem(USERS_LS));
  const idx = users.findIndex(u => u.id === userId);
  
  if (idx === -1) return { ok: false, erro: 'Usuário não encontrado' };
  if (userId === 1) return { ok: false, erro: 'Não pode deletar admin padrão' };
  
  users.splice(idx, 1);
  localStorage.setItem(USERS_LS, JSON.stringify(users));
  audit('user_deleted', `Usuário ${users[idx].nome} deletado`, { userId });
  
  return { ok: true };
}

import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE_PATH = path.join(process.cwd(), 'server', 'authorized_users.txt');

/**
 * Inicializa el archivo si no existe
 */
function ensureFileExists() {
  if (!fs.existsSync(AUTH_FILE_PATH)) {
    fs.writeFileSync(AUTH_FILE_PATH, '', 'utf8');
  }
}

/**
 * Obtiene la lista de IDs autorizados
 */
export async function getAuthorizedTelegramUsers(): Promise<string[]> {
  ensureFileExists();
  const content = fs.readFileSync(AUTH_FILE_PATH, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Agrega un ID a la lista
 */
export async function addAuthorizedTelegramUser(telegramId: string): Promise<boolean> {
  ensureFileExists();
  const users = await getAuthorizedTelegramUsers();
  if (users.includes(telegramId)) {
    return true; // Ya está autorizado
  }
  
  users.push(telegramId);
  fs.writeFileSync(AUTH_FILE_PATH, users.join('\n'), 'utf8');
  return true;
}

/**
 * Elimina un ID de la lista
 */
export async function removeAuthorizedTelegramUser(telegramId: string): Promise<boolean> {
  ensureFileExists();
  let users = await getAuthorizedTelegramUsers();
  if (!users.includes(telegramId)) {
    return true; // No estaba en la lista
  }
  
  users = users.filter((id) => id !== telegramId);
  fs.writeFileSync(AUTH_FILE_PATH, users.join('\n'), 'utf8');
  return true;
}

/**
 * Verifica si un ID está autorizado
 */
export async function isTelegramUserAuthorized(telegramId: string): Promise<boolean> {
  ensureFileExists();
  const users = await getAuthorizedTelegramUsers();
  return users.includes(telegramId);
}

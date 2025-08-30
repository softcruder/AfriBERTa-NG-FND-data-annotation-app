// Admin email addresses
const ADMIN_EMAILS = [
  'oladipona17@gmail.com',
  'nasirullah.m1901406@st.futminna.edu.ng'
]

/**
 * Check if a user email is an admin
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Determine user role based on email
 */
export function getUserRole(email: string): 'admin' | 'annotator' {
  return isAdminEmail(email) ? 'admin' : 'annotator'
}
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface LoginData {
  email: string
  password: string
}

export interface UserPayload {
  id: number
  email: string
  name: string
  role: Role
  language: string
}

export async function validateUser(loginData: LoginData): Promise<UserPayload | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    })

    if (!user) {
      return null
    }

    const isValidPassword = await bcrypt.compare(loginData.password, user.password)
    
    if (!isValidPassword) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      language: user.language
    }
  } catch (error) {
    console.error('Error validating user:', error)
    return null
  }
}

export function generateJWT(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyJWT(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch (error) {
    console.error('Error verifying JWT:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function createUser(userData: {
  email: string
  name: string
  password: string
  role: Role
  language?: string
}) {
  const hashedPassword = await hashPassword(userData.password)
  
  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      language: userData.language || 'en'
    }
  })
}

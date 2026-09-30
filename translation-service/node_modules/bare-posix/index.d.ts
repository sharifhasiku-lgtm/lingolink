export function getgid(): number

export function setgid(id: number | string): void

export function getegid(): number

export function setegid(id: number | string): void

export function getuid(): number

export function setuid(id: number | string): void

export function geteuid(): number

export function seteuid(id: number | string): void

export function getgroups(): number[]

export interface Group {
  groupname: string
  passwd: string
  gid: number
  members: string[]
}

export function getgrnam(name: string): Group | null

export interface Passwd {
  username: string
  passwd: string
  uid: number
  gid: number
  gecos: string
  homedir: string
  shell: string
}

export function getpwnam(name: string): Passwd | null

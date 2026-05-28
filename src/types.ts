export type Stats = {
  userActive: number;
  deviceInstall: number;
  userTrial: number;
};

export type PasswordEntry = {
  id: string;
  tid: string;
  password: string;
  status: 'Berbayar' | 'Trial' | 'Expired';
  session: string;
  createdAt: number;
};

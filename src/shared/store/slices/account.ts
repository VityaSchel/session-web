import { DbAccount } from '@/shared/api/storage'
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface AccountState {
  authorized: boolean
  dbAccount: DbAccount | null
}

const initialState: AccountState = {
  authorized: false,
  dbAccount: null
}

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAuthorized: (state, action: PayloadAction<boolean>) => {
      state.authorized = action.payload
    },
    setAccount: (state, action: PayloadAction<DbAccount | null>) => {
      state.dbAccount = action.payload
    }
  },
})

export const { setAuthorized, setAccount } = accountSlice.actions

export const selectAuthState = (state: { account: AccountState }) => state.account.authorized
export const selectAccount = (state: { account: AccountState }) => state.account.dbAccount

export default accountSlice.reducer
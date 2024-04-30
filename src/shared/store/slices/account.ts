import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface AccountState {
  authorized: boolean
}

const initialState: AccountState = {
  authorized: false,
}

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAuthorized: (state, action: PayloadAction<boolean>) => {
      state.authorized = action.payload
    }
  },
})

export const { setAuthorized } = accountSlice.actions

export default accountSlice.reducer
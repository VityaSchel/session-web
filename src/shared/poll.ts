import { ConversationType } from '@/shared/api/conversations'
import { getNewMessages } from '@/shared/api/messages'
import { fetchSnodesList } from '@/shared/api/snodes'
import { DbUser, db } from '@/shared/api/storage'
import { store } from '@/shared/store'
import { selectAccount } from '@/shared/store/slices/account'
import _ from 'lodash'
import { toast } from 'sonner'

let snodes: string[] = []
let targetNode = '116.203.146.221:22105'
export async function poll() {
  if(!targetNode) {
    snodes = await fetchSnodesList()
    if (snodes.length === 0) {
      toast.error('No snodes available')
      return
    }
    targetNode = _.sample(snodes) as string
  }

  const state = store.getState()
  const account = selectAccount(state)
  if (!account) return

  const messages = await getNewMessages(targetNode)
  const accountSessionID = account.sessionID
  db.messages.bulkAdd(messages.map(msg => ({ 
    conversationID: msg.envelope.source,
    hash: msg.hash,
    accountSessionID,
    textContent: msg.content.dataMessage?.body ?? null,
    read: false,
    timestamp: msg.sentAtTimestamp
  })))
  
  const profilesUnfiltered = _.uniqBy(messages.map(msg => ({
    sessionID: msg.envelope.source,
    displayName: msg.content.dataMessage?.profile?.displayName ?? undefined,
    // profileImage: msg.content.dataMessage?.profile?.profilePicture,
  } satisfies DbUser)), 'sessionID')
  const profiles: DbUser[] = []
  for (const profile of profilesUnfiltered) {
    if(!await db.users.get(profile.sessionID)) {
      profiles.push(profile)
    }
  }
  await db.users.bulkAdd(profiles)


  for(const msg of messages) {
    if (!await db.conversations.get({ id: msg.envelope.source, accountSessionID: account.sessionID })) {
      await db.conversations.add({
        type: ConversationType.DirectMessages,
        accountSessionID,
        id: msg.envelope.source,
        displayName: msg.content.dataMessage?.profile?.displayName ?? undefined,
        // profileImage: msg.content.dataMessage?.profile?.profilePicture,
        // lastMessage: msg.content.dataMessage?.body ?? null,
        // lastMessageTime: msg.timestamp,
      })
    }
  }
}
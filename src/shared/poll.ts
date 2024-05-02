import { ConversationType } from '@/shared/api/conversations'
import { getNewMessages } from '@/shared/api/messages-receiver'
import { DbUser, db } from '@/shared/api/storage'
import { getTargetSwarm } from '@/shared/nodes'
import { store } from '@/shared/store'
import { selectAccount } from '@/shared/store/slices/account'
import _ from 'lodash'
import { v4 as uuid } from 'uuid'

export async function poll() {
  const targetSwarm = await getTargetSwarm()

  const state = store.getState()
  const account = selectAccount(state)
  if (!account) return

  const messages = await getNewMessages(targetSwarm)
  const dataMessages = messages.filter(msg => msg.content.dataMessage)
  const accountSessionID = account.sessionID
  
  db.messages.bulkAdd(
    dataMessages
      .map(msg => { 
        const direction = msg.to ? 'outgoing' : 'incoming'
        return {
          direction,
          conversationID: msg.to ?? msg.envelope.source,
          hash: msg.hash,
          accountSessionID,
          textContent: msg.content.dataMessage!.body ?? null,
          read: Number(direction === 'outgoing') as 0 | 1,
          timestamp: msg.sentAtTimestamp,
          sendingStatus: 'sent',
          id: uuid()
        }
      }
    )
  )
  
  const profilesUnfiltered = _.uniqBy(dataMessages.map(msg => ({
    sessionID: msg.to ?? msg.envelope.source,
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

  for (const msg of dataMessages) {
    const sessionID = msg.to ?? msg.from
    const convoExists = await db.conversations.get({ sessionID, accountSessionID: account.sessionID })
    if (!convoExists) {
      await db.conversations.add({
        id: uuid(),
        type: ConversationType.DirectMessages,
        accountSessionID,
        sessionID,
        displayName: msg.content.dataMessage?.profile?.displayName ?? undefined,
        // profileImage: msg.content.dataMessage?.profile?.profilePicture,
        lastMessage: {
          direction: msg.to ? 'outgoing' : 'incoming',
          textContent: msg.content.dataMessage?.body ?? null
        },
        lastMessageTime: msg.sentAtTimestamp,
      })
    } else {
      await db.conversations.update(convoExists.id, {
        lastMessage: {
          direction: msg.to ? 'outgoing' : 'incoming',
          textContent: msg.content.dataMessage?.body ?? null
        },
        lastMessageTime: msg.sentAtTimestamp
      })
    }
  }
}
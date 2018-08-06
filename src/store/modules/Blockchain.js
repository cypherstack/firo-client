import * as types from '../types/Blockchain'

import Debug from 'debug'
const debug = Debug('zcoin:store:blockchain')

const state = {
    connections: 0,
    currentBlock: {
        height: 0,
        timestamp: 0
    },
    status: {
        isBlockchainSynced: false,
        isFailed: false,
        isSynced: false,
        isWinnersListSynced: false,
        isZnodeListSynced: false
    },
    testnet: true,
    type: 'full'
}

const mutations = {
    [types.SET_CONNECTIONS] (state, connections) {
        state.connections = connections
    },

    [types.SET_CURRENT_BLOCK] (state, { height, timestamp }) {
        state.currentBlock = {
            height,
            timestamp
        }
    },

    [types.IS_BLOCKCHAIN_SYNCED] (state, isSynced) {
        state.status = {
            ...state.status,
            IsBlockchainSynced: isSynced
        }
    },

    [types.IS_FAILED] (state, isFailed) {
        state.status = {
            ...state.status,
            IsFailed: isFailed
        }
    },

    [types.IS_SYNCED] (state, isSynced) {
        state.status = {
            ...state.status,
            IsSynced: isSynced
        }
    },

    [types.IS_WINNERS_LIST_SYNCED] (state, isSynced) {
        state.status = {
            ...state.status,
            IsWinnersListSynced: isSynced
        }
    },

    [types.IS_ZNODE_LIST_SYNCED] (state, isSynced) {
        state.status = {
            ...state.status,
            IsZnodeListSynced: isSynced
        }
    },

    [types.SET_NETWORK_TO_MAINNET] (state) {
        state.testnet = false
    },

    [types.SET_NETWORK_TO_TESTNET] (state) {
        state.testnet = true
    },

    [types.IS_FULL_NODE] (state) {
        // todo get string from config
        state.type = 'full'
    }
}

const actions = {
    [types.SET_INITIAL_STATE] ({ dispatch, commit, state }, initialState) {
        console.log('ON BLOCKCHAIN INITIAL STATE', initialState)

        const { connections, currentBlock, status, testnet: isTestnet, type: clientType } = initialState
        const { height, timestamp } = currentBlock
        console.log('got block!', initialState)
        dispatch(types.SET_CONNECTIONS, connections)

        // todo remove parsing when https://github.com/joernroeder/zcoin-client/issues/59 is fixed
        dispatch(types.SET_CURRENT_BLOCK, {
            height: typeof height === 'number' ? height : parseInt(height),
            timestamp: typeof timestamp === 'number' ? timestamp : parseInt(timestamp)
        })

        if (isTestnet) {
            commit(types.SET_NETWORK_TO_TESTNET)
        } else {
            commit(types.SET_NETWORK_TO_MAINNET)
        }

        dispatch(types.SET_CLIENT_TYPE, clientType)

        if (!status) {
            return
        }

        for (let [key, value] of Object.entries(status)) {
            if (state.status[key] === undefined) {
                debug('unknown blockchain status key', key, value)
                continue
            }

            if (state.status[key] === value) {
                continue
            }

            const mutationName = key.replace(/\.?([A-Z]+)/g, function (x, y) {
                return '_' + y
            }).replace(/^_/, '').toUpperCase()

            if (!types[mutationName]) {
                debug('no mutation name found for', mutationName)
            }

            console.log('committing mutation', mutationName)

            commit(types[mutationName], value)
        }
    },

    [types.ON_BLOCK_SUBSCRIPTION] ({ dispatch }, block) {
        console.log('ON_BLOCK_SUBSCRIPTION')

        dispatch(types.SET_INITIAL_STATE, block)
    },

    [types.SET_CONNECTIONS] ({ commit, state }, connections) {
        if (!connections || isNaN(connections) || connections === state.connections) {
            return
        }

        commit(types.SET_CONNECTIONS, connections)
    },

    [types.SET_CURRENT_BLOCK] ({ commit, state }, { height, timestamp }) {
        if (!height || !timestamp) {
            return
        }

        if (height === state.currentBlock.height) {
            return
        }

        commit(types.SET_CURRENT_BLOCK, { height, timestamp })
    },

    [types.SET_NETWORK_TYPE] ({ commit, state }, type) {
        if (!type) {
            return
        }

        switch (type.toLowerCase()) {
        case 'main':
            commit(types.SET_NETWORK_TO_MAINNET)
            break

        case 'test':
            commit(types.SET_NETWORK_TO_TESTNET)
            break

        default:
            debug('unrecognized network type given')
            break
        }
    },

    [types.SET_CLIENT_TYPE] ({ commit, state }, type) {
        if (!type) {
            return
        }

        if (type === state.type) {
            return
        }

        switch (type.toLowerCase()) {
        case 'full':
            commit(types.IS_FULL_NODE)
            break

        default:
            debug('unrecognized client type given')
            break
        }
    }
}

const getters = {
    currentBlockHeight: (state) => state.currentBlock.height,
    isTestnet: (state) => state.testnet,
    isMainnet: (state, getters) => !getters.isTestnet,
    networkIdentifier: (state, getters) => getters.isMainnet ? 'mainnet' : 'testnet'
}

export default {
    namespaced: true,
    state,
    mutations,
    actions,
    getters
}

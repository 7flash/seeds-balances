'use strict'

const fp = require('fastify-plugin')
const rp = require('request-promise')

const endpointApi = 'https://telos.caleos.io'

const systemAccounts = [
    'gift.seeds',
    'milest.seeds',
    'hypha.seeds',
    'allies.seeds',
    'refer.seeds',
    'bank.seeds',
    'system.seeds',
    'histry.seeds',
    'accts.seeds',
    'harvst.seeds',
    'settgs.seeds',
    'funds.seeds',
    'invite.seeds',
    'rules.seeds',
    'token.seeds',
    'policy.seeds',
    'join.seeds',
    'free.seeds',
    'tlosto.seeds',
    'escrow.seeds',
    'forum.seeds',
    'schdlr.seeds',
    'orgs.seeds',
]

const isSystemAccount = account => systemAccounts.indexOf(account) != -1

const getDetails = async ({ account, balance }) => {
    const detailsURL = `${endpointApi}/v1/chain/get_table_rows`;

    const response = await rp.post(detailsURL, {
        body: JSON.stringify({
            code: 'accts.seeds',
            scope: 'accts.seeds',
            table: 'users',
            limit: 1,
            lower_bound: ` ${account}`,
            upper_bound: ` ${account}`,
            json: true
        })
    })

    const rows = JSON.parse(response).rows

    const image = rows.length == 1 && rows[0].image ? rows[0].image :
        `https://ui-avatars.com/api/?name=${account}&rounded=true&size=100&background=327a81&color=ffffff`

    const nickname = rows.length == 1 && rows[0].nickname ? rows[0].nickname :
        isSystemAccount(account) ? 'System' : 'Unknown'

    return {
        image, nickname, account, balance
    }
}

const getAccounts = async () => {
    const scopeURL = `${endpointApi}/v1/chain/get_table_by_scope`

    const response = await rp.post(scopeURL, {
        body: JSON.stringify({
            code: 'token.seeds',
            table: 'accounts',
            limit: 1000
        })
    })

    const rows = JSON.parse(response).rows

    return rows.map(row => row.scope)
}

const getBalance = async (account) => {
    const balanceURL = `${endpointApi}/v1/chain/get_currency_balance`

    const response = await rp.post(balanceURL, {
        body: JSON.stringify({
            code: 'token.seeds',
            account: account,
            symbol: 'SEEDS'
        })
    })

    const balance = JSON.parse(response)[0]

    return { account, balance }
}

module.exports = fp(async function (fastify, opts) {
    fastify.decorate('balances', async function () {
        const accounts = await getAccounts()

        const allBalances = await Promise.all(
            accounts.map(account => getBalance(account))
        )

        const balances = allBalances.filter(item => Number.parseFloat(item.balance) > 0)

        balances.sort((a, b) => {
            const balanceA = Number.parseFloat(a.balance)
            const balanceB = Number.parseFloat(b.balance)

            if (balanceA < balanceB) return 1;
            if (balanceA > balanceB) return -1;
            return 0;
        })

        const totalUsersBalance = balances
            .filter(item => systemAccounts.indexOf(item.account) == -1)
            .reduce((prev, curr) => prev + Number.parseFloat(curr.balance), 0)

        const totalSystemBalance = balances
            .filter(item => systemAccounts.indexOf(item.account) != -1)
            .reduce((prev, curr) => prev + Number.parseFloat(curr.balance), 0)

        const detailedBalances = await Promise.all(
            balances.map(balance => getDetails(balance))
        )

        const result = {
            "balances": detailedBalances,
            "total_users_balance": `${totalUsersBalance.toFixed(4)} SEEDS`,
            "total_system_balance": `${totalSystemBalance.toFixed(4)} SEEDS`,
        }

        return result
    })
})
import { beforeAll, describe, expect, it } from 'bun:test'
import variant from '@jitl/quickjs-ng-wasmfile-release-asyncify'
import { loadAsyncQuickJs } from '../../loadAsyncQuickJs.js'
import type { OkResponse } from '../../types/OkResponse.js'

describe('async - decimal.js', () => {
	let runtime: Awaited<ReturnType<typeof loadAsyncQuickJs>>

	beforeAll(async () => {
		runtime = await loadAsyncQuickJs(variant)
	})

	const runCode = async (code: string, options: object = {}) => {
		return await runtime.runSandboxed(async ({ evalCode }) => {
			return await evalCode(code)
		}, options)
	}

	it('can import decimal.js without an option', async () => {
		const code = `
			import Decimal from 'decimal.js'
			export default new Decimal('0.1').plus('0.2').toString()
		`

		const result = (await runCode(code)) as OkResponse

		expect(result.ok).toBeTrue()
		expect(result.data).toBe('0.3')
	})

	it('does not register the global Decimal by default', async () => {
		const code = `
			export default typeof Decimal
		`

		const result = (await runCode(code)) as OkResponse

		expect(result.ok).toBeTrue()
		expect(result.data).toBe('undefined')
	})

	it('registers the global Decimal when enableDecimalGlobal is true', async () => {
		const code = `
			export default new Decimal('1').dividedBy('3').toFixed(10)
		`

		const result = (await runCode(code, { enableDecimalGlobal: true })) as OkResponse

		expect(result.ok).toBeTrue()
		expect(result.data).toBe('0.3333333333')
	})

	it('keeps the global Decimal and the imported Decimal identical', async () => {
		const code = `
			import Decimal from 'decimal.js'
			export default Decimal === globalThis.Decimal
		`

		const result = (await runCode(code, { enableDecimalGlobal: true })) as OkResponse

		expect(result.ok).toBeTrue()
		expect(result.data).toBeTrue()
	})
})

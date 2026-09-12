import { beforeAll, describe, expect, it } from 'bun:test'
import variant from '@jitl/quickjs-ng-wasmfile-release-sync'
import { loadQuickJs } from '../../loadQuickJs.js'
import type { OkResponse } from '../../types/OkResponse.js'

describe('sync - node:util - base', () => {
	let runtime: Awaited<ReturnType<typeof loadQuickJs>>

	beforeAll(async () => {
		runtime = await loadQuickJs(variant)
	})

	const runCode = async (code: string) => {
		return await runtime.runSandboxed(async ({ evalCode }) => {
			return await evalCode(code)
		})
	}

	it('promisify works correctly', async () => {
		const code = `
			function callbackFunction(arg, callback) {
        if (arg === 'error') {
          callback(new Error('Test error'))
        } else {
          callback(null, 'Test success')
        }
			}

			import { promisify } from 'node:util'
			const promiseFunction = promisify(callbackFunction)

			async function testPromisify() {
				const successResult = await promiseFunction('success')
				if (successResult !== 'Test success') {
					throw new Error('Promisify test failed for success case')
				}

				try {
					await promiseFunction('error')
				} catch (error) {
					if (error.message !== 'Test error') {
						throw new Error('Promisify test failed for error case')
					}
				}

				return 'Test passed'
			}

			export default await testPromisify()
		`

		const result = await runCode(code)
		expect(result.ok).toBeTrue()
		expect((result as OkResponse).data).toBe('Test passed')
	})

	it('callbackify works correctly', async () => {
		const code = `
			async function asyncFunction(arg) {
				if (arg === 'error') {
					throw new Error('Test error')
				} else {
					return 'Test success'
				}
			}

			import { callbackify } from 'node:util'
			const callbackFunction = callbackify(asyncFunction)

			function testCallbackify() {
				return new Promise((resolve, reject) => {
					callbackFunction('success', (err, result) => {
						if (err || result !== 'Test success') {
							reject(new Error('Callbackify test failed for success case'))
						} else {
							callbackFunction('error', (err, result) => {
								if (!err || err.message !== 'Test error') {
									reject(new Error('Callbackify test failed for error case'))
								} else {
									resolve('Test passed')
								}
							})
						}
					})
				})
			}

			export default await testCallbackify()
		`

		const result = await runCode(code)
		expect(result.ok).toBeTrue()
		expect((result as OkResponse).data).toBe('Test passed')
	})

	describe('TextDecoder', () => {
		const decode = async (setup: string, argument: string) => {
			const result = await runtime.runSandboxed(async ({ evalCode }) => {
				return await evalCode(`
					${setup}
					export default new TextDecoder().decode(${argument})
				`)
			})
			expect(result.ok).toBeTrue()
			return (result as OkResponse).data
		}

		const decodeError = async (argument: string) => {
			const result = await runtime.runSandboxed(async ({ evalCode }) => {
				return await evalCode(`
					let outcome = 'the decode call did not throw'
					try {
						new TextDecoder().decode(${argument})
					} catch (error) {
						outcome = error.constructor.name + ': ' + error.message
					}
					export default outcome
				`)
			})
			expect(result.ok).toBeTrue()
			return (result as OkResponse).data
		}

		const helloWorld = "const bytes = new TextEncoder().encode('hello world')"

		it('decodes an ArrayBuffer', async () => {
			expect(await decode(helloWorld, 'bytes.buffer')).toBe('hello world')
		})

		it('decodes a DataView', async () => {
			expect(await decode(helloWorld, 'new DataView(bytes.buffer)')).toBe('hello world')
		})

		it('decodes a Uint8Array', async () => {
			expect(await decode(helloWorld, 'bytes')).toBe('hello world')
		})

		it('decodes a view that starts at a byte offset', async () => {
			expect(await decode(helloWorld, 'new Uint8Array(bytes.buffer, 6)')).toBe('world')
		})

		it('decodes a view that has a shorter byte length', async () => {
			expect(await decode(helloWorld, 'new Uint8Array(bytes.buffer, 0, 5)')).toBe('hello')
		})

		it('decodes a view that has signed elements', async () => {
			const setup = "const bytes = new TextEncoder().encode('héllo')"
			expect(await decode(setup, 'new Int8Array(bytes.buffer)')).toBe('héllo')
		})

		it('decodes multibyte characters from an ArrayBuffer', async () => {
			const setup = "const bytes = new TextEncoder().encode('héllo 🌍')"
			expect(await decode(setup, 'bytes.buffer')).toBe('héllo 🌍')
		})

		it('returns an empty string for no argument', async () => {
			expect(await decode('', '')).toBe('')
		})

		it('returns an empty string for an empty ArrayBuffer', async () => {
			expect(await decode('', 'new ArrayBuffer(0)')).toBe('')
		})

		it('decodes a payload that is larger than one internal chunk', async () => {
			const result = await runtime.runSandboxed(async ({ evalCode }) => {
				return await evalCode(`
					let source = ''
					while (source.length < 100000) source += 'héllo 🌍 world '
					const bytes = new TextEncoder().encode(source)
					const decoded = new TextDecoder().decode(bytes.buffer)
					export default decoded === source ? 'match' : 'mismatch at length ' + decoded.length
				`)
			})
			expect(result.ok).toBeTrue()
			expect((result as OkResponse).data).toBe('match')
		})

		it('throws a TypeError for a string', async () => {
			expect(await decodeError("'hello world'")).toStartWith('TypeError')
		})

		it('throws a TypeError for null', async () => {
			expect(await decodeError('null')).toStartWith('TypeError')
		})
	})
})

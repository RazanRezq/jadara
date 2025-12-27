#!/usr/bin/env bun
import dbConnect from '../src/lib/mongodb'
import PermissionSet from '../src/models/Permissions/permissionsSchema'

async function initPermissions() {
    try {
        await dbConnect()
        console.log('Connected to MongoDB')

        // Initialize default permissions
        await PermissionSet.initializeDefaults()
        console.log('✅ Default permissions initialized')

        // Display current permissions
        const permissions = await PermissionSet.find({}).sort({ role: 1 })
        console.log('\nCurrent Permissions in Database:')
        for (const perm of permissions) {
            console.log(`\n${perm.role.toUpperCase()}:`)
            console.log(`  Display Name: ${perm.displayName.en}`)
            console.log(`  Permissions: ${perm.permissions.join(', ')}`)
        }

        process.exit(0)
    } catch (error) {
        console.error('Error initializing permissions:', error)
        process.exit(1)
    }
}

initPermissions()

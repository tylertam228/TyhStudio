/**
 * Interaction Create Event
 */

const { logCommand, logButton, logError } = require('../../services/logger');

module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            await handleAutocomplete(interaction);
            return;
        }

        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            
            if (!command) {
                console.error(`Command not found: ${interaction.commandName}`);
                return;
            }
            
            logCommand(interaction).catch(err => console.error('Log error:', err));
            
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                logError(error, `Command: /${interaction.commandName}`).catch(err => console.error('Log error:', err));
                
                const errorMessage = { content: 'An error occurred!', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        if (interaction.isButton()) {
            logButton(interaction).catch(err => console.error('Log error:', err));
            
            try {
                await handleButtonInteraction(interaction);
            } catch (error) {
                console.error('Error handling button:', error);
                logError(error, `Button: ${interaction.customId}`).catch(err => console.error('Log error:', err));
                
                await interaction.reply({ content: 'Button error occurred', ephemeral: true });
            }
        }
    }
};

async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const feature = parts[0];

    // Load feature-specific button handler
    try {
        const featurePath = `../features/${feature}/command`;
        const featureModule = require(featurePath);
        if (featureModule.handleButton) {
            await featureModule.handleButton(interaction);
        }
    } catch (err) {
        console.log('No button handler for:', feature);
    }
}

async function handleAutocomplete(interaction) {
    const commandName = interaction.commandName;
    
    try {
        const command = interaction.client.commands.get(commandName);
        if (command && command.handleAutocomplete) {
            await command.handleAutocomplete(interaction);
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
        await interaction.respond([]);
    }
}

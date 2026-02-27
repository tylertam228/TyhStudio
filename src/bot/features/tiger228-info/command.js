/**
 * Tiger228 Info Command
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatHKDateTime } = require('../../../utils/timezone');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiger228_info')
        .setDescription('🐯 了解更多關於 Tiger228'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🐯 Tiger228')
            .setDescription('**Tyler Tam** - 遊戲工程師\n\n歡迎了解更多關於我！')
            .setThumbnail('https://github.com/tylertam228.png')
            .addFields(
                { 
                    name: '🌐 網站', 
                    value: '[tyhstudio.com](https://tyhstudio.com)',
                    inline: true 
                },
                { 
                    name: '📧 電郵', 
                    value: '[tiger228.tyh@outlook.com](mailto:tiger228.tyh@outlook.com)',
                    inline: true 
                },
                { 
                    name: '\u200B', 
                    value: '\u200B',
                    inline: true 
                },
                { 
                    name: '💻 GitHub', 
                    value: '[github.com/tylertam228](https://github.com/tylertam228)',
                    inline: true 
                },
                { 
                    name: '💼 LinkedIn', 
                    value: '[Tyler Tam](https://www.linkedin.com/in/tyler-tam-s228/)',
                    inline: true 
                },
                { 
                    name: '\u200B', 
                    value: '\u200B',
                    inline: true 
                },
                {
                    name: '☕ 支持我',
                    value: '[Buy Me a Coffee](https://buymeacoffee.com/tiger228)',
                    inline: false
                }
            )
            .setFooter({ text: `🐯 Tiger-228 Bot | ${formatHKDateTime(new Date())}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

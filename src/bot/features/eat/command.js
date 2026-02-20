/**
 * Eat Command - Guild-based shared restaurant list
 */

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
} = require('discord.js');
const restaurantModel = require('./model');

const PRICE_EMOJI = {
    '$': '$',
    '$$': '$$',
    '$$$': '$$$',
    '$$$$': '$$$$',
};

const PRICE_LABELS = {
    '$': '便宜',
    '$$': '適中',
    '$$$': '高檔',
    '$$$$': '豪華',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eat')
        .setDescription('🍽️ 群組餐廳管理與隨機選擇')
        .addSubcommand(subcommand =>
            subcommand
                .setName('random')
                .setDescription('🎲 從群組餐廳清單隨機選擇')
                .addStringOption(option =>
                    option.setName('cuisine')
                        .setDescription('篩選料理類型')
                        .setRequired(false)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('price')
                        .setDescription('篩選價位')
                        .setRequired(false)
                        .addChoices(
                            { name: '$ 便宜', value: '$' },
                            { name: '$$ 適中', value: '$$' },
                            { name: '$$$ 高檔', value: '$$$' },
                            { name: '$$$$ 豪華', value: '$$$$' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ 新增餐廳到群組清單')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('餐廳名稱')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('cuisine')
                        .setDescription('料理類型')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('location')
                        .setDescription('餐廳地點')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('price')
                        .setDescription('價位範圍')
                        .setRequired(false)
                        .addChoices(
                            { name: '$ 便宜', value: '$' },
                            { name: '$$ 適中', value: '$$' },
                            { name: '$$$ 高檔', value: '$$$' },
                            { name: '$$$$ 豪華', value: '$$$$' }
                        ))
                .addIntegerOption(option =>
                    option.setName('rating')
                        .setDescription('評分 (1-5)')
                        .setRequired(false)
                        .setMinValue(1)
                        .setMaxValue(5))
                .addStringOption(option =>
                    option.setName('notes')
                        .setDescription('備註')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 查看群組餐廳清單')
                .addStringOption(option =>
                    option.setName('cuisine')
                        .setDescription('篩選料理類型')
                        .setRequired(false)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ 刪除餐廳（僅限新增者）')
                .addStringOption(option =>
                    option.setName('restaurant_id')
                        .setDescription('餐廳 ID')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('rate')
                .setDescription('⭐ 評價餐廳')
                .addStringOption(option =>
                    option.setName('restaurant_id')
                        .setDescription('餐廳 ID')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addIntegerOption(option =>
                    option.setName('rating')
                        .setDescription('評分 (1-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (!interaction.guildId) {
            return interaction.reply({ content: '此指令只能在伺服器中使用', ephemeral: true });
        }

        switch (subcommand) {
            case 'random':
                await handleRandom(interaction);
                break;
            case 'add':
                await handleAdd(interaction);
                break;
            case 'list':
                await handleList(interaction);
                break;
            case 'delete':
                await handleDelete(interaction);
                break;
            case 'rate':
                await handleRate(interaction);
                break;
        }
    },

    async handleAutocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();

        if (focusedOption.name === 'cuisine') {
            const types = await restaurantModel.getCuisineTypes(interaction.guildId);
            const choices = types
                .filter(t => t.toLowerCase().includes(focusedValue))
                .slice(0, 25)
                .map(t => ({ name: t, value: t }));
            await interaction.respond(choices);
        } else if (focusedOption.name === 'restaurant_id') {
            const restaurants = await restaurantModel.getRestaurantsByGuild(interaction.guildId);
            const choices = restaurants
                .filter(r => 
                    r.name.toLowerCase().includes(focusedValue) || 
                    r.id.toLowerCase().includes(focusedValue)
                )
                .slice(0, 25)
                .map(r => ({
                    name: `${r.name} (${r.id.slice(0, 8)})`,
                    value: r.id.slice(0, 8),
                }));
            await interaction.respond(choices);
        }
    },

    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];

        if (action === 'reroll') {
            const cuisine = parts[2] === 'any' ? null : parts[2];
            const price = parts[3] === 'any' ? null : parts[3];

            const options = {};
            if (cuisine) options.cuisineType = cuisine;
            if (price) options.priceRange = price;

            const restaurant = await restaurantModel.getRandomRestaurant(interaction.guildId, options);

            if (!restaurant) {
                return interaction.reply({ content: '找不到餐廳', ephemeral: true });
            }

            const embed = buildRestaurantEmbed(restaurant);
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eat_reroll_${cuisine || 'any'}_${price || 'any'}`)
                        .setLabel('🎲 再抽一次')
                        .setStyle(ButtonStyle.Primary),
                );

            await interaction.update({ embeds: [embed], components: [row] });
        }
    },
};

function buildRestaurantEmbed(restaurant) {
    const embed = new EmbedBuilder()
        .setTitle('🍽️ 今天吃這個！')
        .setColor(0xFF6B6B)
        .addFields({ name: '🏪 餐廳', value: `**${restaurant.name}**` });

    if (restaurant.cuisine_type) {
        embed.addFields({ name: '🍜 類型', value: restaurant.cuisine_type, inline: true });
    }

    if (restaurant.price_range) {
        embed.addFields({ name: '💰 價位', value: `${PRICE_EMOJI[restaurant.price_range]} ${PRICE_LABELS[restaurant.price_range]}`, inline: true });
    }

    if (restaurant.location) {
        embed.addFields({ name: '📍 地點', value: restaurant.location, inline: true });
    }

    if (restaurant.rating) {
        embed.addFields({ name: '⭐ 評分', value: '★'.repeat(restaurant.rating) + '☆'.repeat(5 - restaurant.rating), inline: true });
    }

    if (restaurant.notes) {
        embed.addFields({ name: '📝 備註', value: restaurant.notes });
    }

    embed.addFields({ name: '👤 推薦者', value: `<@${restaurant.user_id}>`, inline: true });

    embed.setTimestamp();
    return embed;
}

async function handleRandom(interaction) {
    const cuisine = interaction.options.getString('cuisine');
    const price = interaction.options.getString('price');

    try {
        const options = {};
        if (cuisine) options.cuisineType = cuisine;
        if (price) options.priceRange = price;

        const restaurant = await restaurantModel.getRandomRestaurant(interaction.guildId, options);

        if (!restaurant) {
            return interaction.reply({ content: '群組裡還沒有餐廳。使用 `/eat add` 來新增！', ephemeral: true });
        }

        const embed = buildRestaurantEmbed(restaurant);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`eat_reroll_${cuisine || 'any'}_${price || 'any'}`)
                    .setLabel('🎲 再抽一次')
                    .setStyle(ButtonStyle.Primary),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error('Error getting random restaurant:', error);
        await interaction.reply({ content: '發生錯誤', ephemeral: true });
    }
}

async function handleAdd(interaction) {
    const name = interaction.options.getString('name');
    const cuisineType = interaction.options.getString('cuisine');
    const location = interaction.options.getString('location');
    const priceRange = interaction.options.getString('price');
    const rating = interaction.options.getInteger('rating');
    const notes = interaction.options.getString('notes');

    try {
        const restaurant = await restaurantModel.createRestaurant({
            userId: interaction.user.id,
            guildId: interaction.guildId,
            name,
            cuisineType,
            location,
            priceRange,
            rating,
            notes,
        });

        const embed = new EmbedBuilder()
            .setTitle('✅ 餐廳已新增到群組清單')
            .setColor(0x44FF44)
            .addFields({ name: '🏪 餐廳', value: name })
            .addFields({ name: '👤 推薦者', value: `<@${interaction.user.id}>`, inline: true });

        if (cuisineType) {
            embed.addFields({ name: '🍜 類型', value: cuisineType, inline: true });
        }

        if (priceRange) {
            embed.addFields({ name: '💰 價位', value: PRICE_EMOJI[priceRange], inline: true });
        }

        if (location) {
            embed.addFields({ name: '📍 地點', value: location, inline: true });
        }

        if (rating) {
            embed.addFields({ name: '⭐ 評分', value: '★'.repeat(rating) + '☆'.repeat(5 - rating), inline: true });
        }

        embed.setFooter({ text: `ID: ${restaurant.id.slice(0, 8)}` });
        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error adding restaurant:', error);
        await interaction.reply({ content: '新增餐廳時發生錯誤', ephemeral: true });
    }
}

async function handleList(interaction) {
    const cuisine = interaction.options.getString('cuisine');

    try {
        const options = {};
        if (cuisine) options.cuisineType = cuisine;

        const restaurants = await restaurantModel.getRestaurantsByGuild(interaction.guildId, options);

        if (restaurants.length === 0) {
            return interaction.reply({ content: '群組裡還沒有餐廳。使用 `/eat add` 來新增！', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🍽️ 群組餐廳清單')
            .setColor(0x5865F2)
            .setTimestamp();

        const description = restaurants.slice(0, 15).map((r, index) => {
            const ratingStr = r.rating ? ` ${'★'.repeat(r.rating)}` : '';
            const priceStr = r.price_range ? ` ${PRICE_EMOJI[r.price_range]}` : '';
            const cuisineStr = r.cuisine_type ? ` (${r.cuisine_type})` : '';
            return `**${index + 1}. ${r.name}**${cuisineStr}${priceStr}${ratingStr}\n  推薦者: <@${r.user_id}> | ID: \`${r.id.slice(0, 8)}\``;
        }).join('\n\n');

        embed.setDescription(description);
        embed.setFooter({ text: `共 ${restaurants.length} 間` });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing restaurants:', error);
        await interaction.reply({ content: '取得餐廳清單時發生錯誤', ephemeral: true });
    }
}

async function handleDelete(interaction) {
    const restaurantId = interaction.options.getString('restaurant_id');

    try {
        const restaurant = await restaurantModel.getRestaurantById(restaurantId, interaction.guildId);

        if (!restaurant) {
            return interaction.reply({ content: '找不到餐廳', ephemeral: true });
        }

        if (restaurant.user_id !== interaction.user.id) {
            return interaction.reply({ content: '只有推薦者可以刪除這間餐廳', ephemeral: true });
        }

        await restaurantModel.deleteRestaurant(restaurant.id);

        await interaction.reply({ content: `已刪除: **${restaurant.name}**`, ephemeral: true });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        await interaction.reply({ content: '刪除餐廳時發生錯誤', ephemeral: true });
    }
}

async function handleRate(interaction) {
    const restaurantId = interaction.options.getString('restaurant_id');
    const rating = interaction.options.getInteger('rating');

    try {
        const restaurant = await restaurantModel.getRestaurantById(restaurantId, interaction.guildId);

        if (!restaurant) {
            return interaction.reply({ content: '找不到餐廳', ephemeral: true });
        }

        await restaurantModel.updateRestaurant(restaurant.id, { rating });

        await interaction.reply({ 
            content: `已更新 **${restaurant.name}** 評分為 ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}（由 <@${interaction.user.id}> 評價）` 
        });
    } catch (error) {
        console.error('Error rating restaurant:', error);
        await interaction.reply({ content: '更新評分時發生錯誤', ephemeral: true });
    }
}

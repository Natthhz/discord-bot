const { Client, Intents, MessageEmbed } = require('discord.js');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.MESSAGE_CONTENT,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES
  ]
});

const token = '';
const ytdl = require('ytdl-core');
const fs = require('fs');

const imageCounts = new Map();
const imageSizes = new Map();
const userRanking = new Map();
let currentPage = 0; // Menambahkan deklarasi currentPage di sini

async function fetchMessages(channel, limit) {
  const allMessages = [];
  let lastMessageId = null;

  while (true) {
    const options = { limit: Math.min(100, limit - allMessages.length) };
    if (lastMessageId) {
      options.before = lastMessageId;
    }

    const fetchedMessages = await channel.messages.fetch(options);
    if (fetchedMessages.size === 0) {
      break;
    }

    lastMessageId = fetchedMessages.last().id;
    allMessages.push(...fetchedMessages.values());

    if (allMessages.length >= limit) {
      break;
    }
  }

  return allMessages;
}

async function recountImages(guild) {
  const channels = guild.channels.cache.filter((channel) => channel.type === 'GUILD_TEXT');

  for (const channel of channels.values()) {
    const channelID = channel.id;
    const limit = 1000;
    const messages = await fetchMessages(channel, limit);
    let imageCount = 0;
    let totalSize = 0;

    for (const message of messages) {
      if (message.attachments.size > 0) {
        const attachments = message.attachments.toJSON();
        for (const attachment of attachments) {
          if (attachment.contentType.startsWith('image/')) {
            imageCount++;
            totalSize += attachment.size;
          }
        }
      }
    }

    imageCounts.set(channelID, imageCount);
    imageSizes.set(channelID, totalSize);
  }
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  for (const guild of client.guilds.cache.values()) {
    await recountImages(guild);
  }

  client.user.setActivity('Sayangku Kerja', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
  const content = message.content.toLowerCase();
  const userId = message.author.id;

  if (userId === client.user.id) {
    return;
  }

  if (userId === '538928109282394112' || userId === '1160511463308402779' || userId === '538928109282394112') {
    if (content.includes('selamat pagi')) {
      message.reply('Good morning master');

    }

    // Perintah !rank
    if (content === '!rank') {
      const rankedChannels = Array.from(imageCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      const pages = [];
      let page = [];
      let rank = 1;

      for (const [channelID, imageCount] of rankedChannels) {
        const channel = message.guild.channels.cache.get(channelID);
        const channelSizeMB = (imageSizes.get(channelID) / (1024 * 1024)).toFixed(2);
        page.push(`Rank #${rank}: ${channel.name} - ${imageCount} foto (${channelSizeMB} MB)`);

        if (rank % 10 === 0) {
          pages.push(page);
          page = [];
        }

        rank++;
      }

      if (page.length > 0) {
        pages.push(page);
      }

      const embed = new MessageEmbed()
        .setTitle('Peringkat Channel berdasarkan Jumlah Gambar dan Ukuran')
        .setDescription(pages[currentPage].join('\n'))
        .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` })
        .setColor('#00FF00');

      const rankMessage = await message.channel.send({ embeds: [embed] });

      if (pages.length > 1) {
        await rankMessage.react('⬅️');
        await rankMessage.react('➡️');

        const filter = (reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === userId;
        const collector = rankMessage.createReactionCollector({ filter, time: 60000 });

        collector.on('collect', (reaction) => {
          if (reaction.emoji.name === '⬅️') {
            if (currentPage > 0) {
              currentPage--;
            }
          } else if (reaction.emoji.name === '➡️') {
            if (currentPage < pages.length - 1) {
              currentPage++;
            }
          }

          const newEmbed = new MessageEmbed()
            .setTitle('Peringkat Channel berdasarkan Jumlah Gambar dan Ukuran')
            .setDescription(pages[currentPage].join('\n'))
            .setFooter({ text: `Page ${currentPage + 1} of ${pages.length}` })
            .setColor('#00FF00');

          rankMessage.edit({ embeds: [newEmbed] });
        });

        collector.on('end', () => {
          rankMessage.reactions.removeAll().catch(() => {});
        });
      }
    } else if (content.startsWith('!rank ')) {
      const channelName = content.slice(6);
      const channel = message.guild.channels.cache.find(
        (ch) => ch.name === channelName && ch.type === 'GUILD_TEXT'
      );

      if (channel && imageCounts.has(channel.id)) {
        const channelImageCount = imageCounts.get(channel.id);
        const channelSizeMB = (imageSizes.get(channel.id) / (1024 * 1024)).toFixed(2);
        message.reply(`Rank di #${channelName}: ${channelImageCount} foto (${channelSizeMB} MB).`);
      } else {
        message.reply('Channel tidak ditemukan atau tidak ada gambar.');
      }
    }

    if (content === '!totalukuran') {
      let totalSize = 0;
      imageSizes.forEach((size) => {
        totalSize += size;
      });

      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
      const totalImageCount = Array.from(imageCounts.values()).reduce((a, b) => a + b, 0);
      const embed = new MessageEmbed()
        .setTitle('Total Ukuran Gambar di Semua Channel')
        .setDescription(`Total Ukuran Gambar: ${totalSizeMB} MB (${totalImageCount} foto)`)
        .setColor('#00FF00');
      message.channel.send({ embeds: [embed] });
    }

    if (content === '!jumlah') {
      let totalImages = 0;
      imageCounts.forEach((count) => {
        totalImages += count;
      });

      const totalSizeMB = (Array.from(imageSizes.values()).reduce((a, b) => a + b, 0) / (1024 * 1024)).toFixed(2);
      const embed = new MessageEmbed()
        .setTitle('Jumlah gambar dari semua channel')
        .setDescription(`Jumlah gambar: ${totalImages}, Ukuran total: ${totalSizeMB} MB`)
        .setColor('#00FF00');
      message.channel.send({ embeds: [embed] });
    }

    if (content.startsWith('!jumlah ')) {
      const channelName = content.slice(8);
      const channel = message.guild.channels.cache.find(
        (ch) => ch.name === channelName && ch.type === 'GUILD_TEXT'
      );

      if (channel && imageCounts.has(channel.id)) {
        const channelImageCount = imageCounts.get(channel.id);
        const channelSizeMB = (imageSizes.get(channel.id) / (1024 * 1024)).toFixed(2);
        const embed = new MessageEmbed()
          .setTitle(`Jumlah gambar di #${channelName}`)
          .setDescription(`Jumlah gambar: ${channelImageCount}, Ukuran: ${channelSizeMB} MB`)
          .setColor('#00FF00');
        message.channel.send({ embeds: [embed] });
      } else {
        message.reply('Channel tidak ditemukan atau tidak ada gambar.');
      }
    }
  } else {
    message.reply('Kamu tidak diizinkan oleh pemilik bot.');
  }

  if (message.attachments.size > 0) {
    const channelID = message.channel.id;
    const attachments = message.attachments.toJSON();
    let imageSize = 0;

    for (const attachment of attachments) {
      if (attachment.contentType.startsWith('image/')) {
        imageSize += attachment.size;
      }
    }

    if (!imageCounts.has(channelID)) {
      imageCounts.set(channelID, 1);
      imageSizes.set(channelID, imageSize);
    } else {
      imageCounts.set(channelID, imageCounts.get(channelID) + 1);
      imageSizes.set(channelID, imageSizes.get(channelID) + imageSize);
    }

    const userRank = userRanking.get(userId) || 0;
    userRanking.set(userId, userRank + imageSize);
  }
});

client.on('messageDelete', (deletedMessage) => {
  if (deletedMessage.attachments.size > 0) {
    const channelID = deletedMessage.channel.id;
    const attachments = deletedMessage.attachments.toJSON();
    let totalSize = imageSizes.get(channelID);

    for (const attachment of attachments) {
      if (attachment.contentType.startsWith('image/')) {
        totalSize -= attachment.size;
      }
    }

    if (imageCounts.has(channelID)) {
      imageSizes.set(channelID, totalSize);
    }
  }
});

//MUsic
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!play ')) {
    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel) {
      message.reply('Anda harus bergabung ke voice channel terlebih dahulu.');
      return;
    }

    const query = message.content.slice(6); // Mengambil judul lagu dari pesan
    const stream = ytdl(query, { filter: 'audioonly' });

    voiceChannel.join().then((connection) => {
      const dispatcher = connection.play(stream);

      dispatcher.on('finish', () => {
        voiceChannel.leave();
      });
    });
  }
});

//  input data
const prefix = '!'; // Ganti dengan prefix bot Anda
const dataFilePath = 'data.txt';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith(prefix + 'inputdata')) {
    const inputData = message.content.slice((prefix + 'inputdata').length).trim();

    try {
      const existingData = fs.readFileSync(dataFilePath, 'utf8');

      // Memeriksa apakah data sudah ada di dalam file
      if (existingData.includes(inputData)) {
        message.reply('Data sudah ada dalam file.');
      } else {
        // Menghitung jumlah data yang sudah ada
        const dataCount = existingData.split('\n').filter(Boolean).length;

        // Menambahkan nomor urut ke setiap data yang diinput
        const newData = `${dataCount + 1}. ${inputData}\n`;

        fs.appendFileSync(dataFilePath, newData);
        message.reply('Data berhasil disimpan!');
      }
    } catch (error) {
      fs.writeFileSync(dataFilePath, `1. ${inputData}\n`);
      message.reply('Data berhasil disimpan!');
    }
  } else if (message.content === prefix + 'showdata') {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      const embed = new MessageEmbed()
        .setTitle('Data yang Telah Disimpan')
        .setDescription(data)
        .setColor('#00FF00');
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      message.reply('Belum ada data yang disimpan.');
    }
  } else if (message.content === prefix + 'resetdata') {
    try {
      fs.writeFileSync(dataFilePath, '');
      message.reply('Data berhasil direset!');
    } catch (error) {
      message.reply('Gagal mereset data.');
    }
  }
});

client.login(token);

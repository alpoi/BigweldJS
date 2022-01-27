const { MessageEmbed } = require("discord.js");

function createEmbed(obj) {

    let embed = new MessageEmbed();

    if (obj.color)        { embed.setColor(obj.color);         }  // ColorResolvable
    if (obj.title)        { embed.setTitle(obj.title);         }  // string
    if (obj.url)          { embed.setURL(obj.url);             }  // string
    if (obj?.author.name) { embed.setAuthor(obj.author);       }  // { name, iconURL, url }
    if (obj.desc)         { embed.setDescription(obj.desc);    }  // string
    if (obj.thumbnail)    { embed.setThumbnail(obj.thumbnail); }  // string
    if (obj.image)        { embed.setImage(obj.image);         }  // string
    if (obj.timestamp)    { embed.setTimestamp(new Date());    }  // bool
    if (obj.footer)       { embed.setFooter(obj.footer);       }  // { text, iconURL }
    if (obj.fields)       { embed.addFields(obj.fields);       }  // [{ name, value, inline }]

}

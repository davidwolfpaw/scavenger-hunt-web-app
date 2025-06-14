# Scavenger Hunt Game

Host your own digital scavenger hunt game! You can use URLs, NFC Tags, QR Codes, or any combination of them to allow users to hunt for clues and stamp a digital passbook showing that they've obtained each clue.

Users can view their progress in real time, whether having to collect individual clues, or a set number of them to reach levels that you set beforehand.

This app generates the URLs and QR Codes needed to play, as well as allows an admin view of each registered user and how far they've completed.

## Features

- User authentication and profiles
- Customizable scavenger hunts
- Real-time progress tracking
- Leaderboards and achievements
- Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
git clone https://github.com/davidwolfpaw/scavenger-hunt-game.git
cd scavenger-hunt-game
npm install
```

Edit `public/config.json` to include your organization name, a default stamp image for claimed tags, any tag specific stamp images, and badge levels.

`scavengerHuntName` shows up in the `<title>` of each page.

`defaultStampImage` can either be the image used for all stamps, or as a fallback if a tag doesn't have a custom tag image.

`totalTags` is the number of tags as part of the hunt.

`tagPositions`*(optional)* allows you to lay out the stamps in a specific order if you choose. The identifier for the tag is followed by the order position.

`tagStamps` is an array of tag identifiers *(required)*, a custom name for the stamp *(optional)*, and a custom image for the stamp *(optional)*.

`badges`*(optional)* is an array of completion levels (the number of tags that need to be scanned to reach that level), a name of the achievement level, whether it is active or not, and an image for that badge level.


### Running the App

```bash
npm start
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

This project is licensed under the MIT License.

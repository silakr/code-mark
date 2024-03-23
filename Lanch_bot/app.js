import dotenv from 'dotenv';
dotenv.config();

import puppeteer from 'puppeteer';
import schedule from 'node-schedule';
import { WebClient } from '@slack/web-api';

const slackToken = process.env.SLACKTOKEN;
const channelId = process.env.CHANNELID;
const web = new WebClient(slackToken);

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD 형식
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeLatestPostImage() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(process.env.TARGETURL);

    //page.goto 는 페이지 접근에 대한 동작만 하기 때문에 유휴시간이 없을 경우에 image 를 못 가져 올 수 있음.
    await sleep(2000);

    // 첫 번째 게시물의 이미지 URL 추출
    const imageUrl = await page.$eval('article > div img', img => img.src);

    await browser.close();
    return imageUrl
}


async function sendImageToSlack(imageURL) {
    const today = getCurrentDate();
    try {
        const result = await web.chat.postMessage({
            channel: channelId,
            text: `식당 - ${today}`,
            blocks: [
                {
                    type: 'image',
                    image_url: imageURL,
                    alt_text: '식당 메뉴'
                }
            ]
        });
        console.log('Message sent: ', result.ts);
    }catch (error) {
        console.error(error);
    }
}


async function doAppFunction(){

    try{
        const imageURL = await scrapeLatestPostImage();
        sendImageToSlack(imageURL);
    }catch (error){
        console.error('비동기 작업 중 오류 발생:', error);
    }
}


// 매일 오전 11시에 작업 스케줄링 (한국 시간대 기준)
/*schedule.scheduleJob('0 0 11 * * 1-5', async function() {
    doAppFunction();
});*/

doAppFunction();

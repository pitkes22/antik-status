const ONLINE_THRESHOLD = 95;
const OFFLINE_THRESHOLD = 50;

const ONLINE_EL = document.getElementById('online');
const OFFLINE_EL = document.getElementById('offline');
const STATUS_EL = document.getElementById('status');
const STATUS_SHORT_EL = document.getElementById('status-short');
const STATUS_LONG_EL = document.getElementById('status-long');

/**
 * @type {null | array}
 */
let ONLINE_SWITCHES = null;

/**
 * @type {null | array}
 */
let OFFLINE_SWITCHES = null;
const withCorsProxy = (url) => {
    return `https://cors-anywhere.herokuapp.com/${url}`
};

const fetchJsonData = (url, callback) => {
    fetch(url)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            callback(data);
        }).catch((e) => {
        console.error('Antik monitoring or CORS proxy is broken!', e)
    })
};

const getIcon = (sw) => {
    if (sw['status'] !== 't' && isOfflineToLong(sw)) {
        return '💀'
    } else {
        return sw['status'] === 't' ? '✔️' : '❌'
    }
};

const getTableHtml = (switches) => {
    const rows = switches.map((sw) => {
        const status = getIcon(sw);
        const hostname = sw['hostname'];
        const ip = sw['ip'];
        const time = sw['timestamp'];
        return `<tr><td>${status}</td><td>${hostname}</td><td>${ip}</td><td>${time}</td></tr>`
    });
    return `<table><tr><th>Stav</th><th>Hostname</th><th>IP</th><th>Čas</th></tr>${rows.join('')}</table>`
};

const isOfflineToLong = (sw) => {
    return sw.timestamp.indexOf('month') !== -1
};

const filterRecentlyDroppedSwitches = (offline_switches) => {
    return offline_switches.filter((sw) => {
        return isOfflineToLong(sw) // Stupid solution for stupid time format
    })
};

const updateStatus = () => {
    if (OFFLINE_SWITCHES == null || ONLINE_SWITCHES == null) return;

    const onlineSwitchesCount = ONLINE_SWITCHES.length;
    const offlineSwitchesCount = filterRecentlyDroppedSwitches(OFFLINE_SWITCHES).length;

    const allSwitchesCount = onlineSwitchesCount + offlineSwitchesCount;

    const percentageOfNetworkOnline = (onlineSwitchesCount / allSwitchesCount) * 100;
    const percentageOfNetworkOffline = (offlineSwitchesCount / allSwitchesCount) * 100;

    let className, shortStatus, longStatus;

    if (percentageOfNetworkOffline > OFFLINE_THRESHOLD) {
        // Is offline
        className = 'offline';
        shortStatus = 'ÁNO';
        longStatus = `${percentageOfNetworkOffline.toFixed(2)}% sieťe je OFFLINE`;
    } else if (percentageOfNetworkOnline > ONLINE_THRESHOLD) {
        // Is online
        className = 'online';
        shortStatus = 'NIE';
        longStatus = `${percentageOfNetworkOnline.toFixed(2)}% sieťe je ONLINE`;
    } else {
        // Is partially online
        className = 'partially';
        shortStatus = 'MOŽNO';
        if (percentageOfNetworkOnline > 50) {
            longStatus = `${percentageOfNetworkOffline.toFixed(2)}% sieťe je OFFLINE`;
        } else {
            longStatus = `${percentageOfNetworkOnline.toFixed(2)}% sieťe je ONLINE`;
        }
    }

    setTimeout(() => document.body.classList.add(className), 0); // Fix issue that transition dont work because browser is stuck at adding table to DOM
    STATUS_SHORT_EL.innerText = shortStatus;
    STATUS_LONG_EL.innerText = longStatus;
};

const handleOfflineSwitchesResponse = (data) => {
    OFFLINE_SWITCHES = data['vw_offline_switches'];
    OFFLINE_EL.innerHTML = getTableHtml(OFFLINE_SWITCHES);
    updateStatus();
};

const handleOnlineSwitchesResponse = (data) => {
    ONLINE_SWITCHES = data['vw_online_switches'];
    ONLINE_EL.innerHTML = getTableHtml(ONLINE_SWITCHES);
    updateStatus();
};

const API_ONLINE = withCorsProxy('http://nat-88-212-48-10.antik.sk/monitoring/onlineSwAll_json.php');
const API_OFFLINE = withCorsProxy('http://nat-88-212-48-10.antik.sk/monitoring/offlineSwAll_timestamp_json.php');

fetchJsonData(API_OFFLINE, handleOfflineSwitchesResponse);
fetchJsonData(API_ONLINE, handleOnlineSwitchesResponse);

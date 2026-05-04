const { sdnClient, SdnControllerError } = require('./sdnClient');
const { mapRyuTopologyBundle, mapRyuSwitches } = require('./sdnTopologyMap');
const { fakeTopology, fakeSwitches } = require('./dashboardStore');

async function getTopology() {
  try {
    const bundle = await sdnClient.fetchTopologyBundle();
    return mapRyuTopologyBundle(bundle);
  } catch (err) {
    if (err instanceof SdnControllerError) {
      return {
        ...fakeTopology,
        switches: fakeTopology.switches.map((s) => ({ ...s })),
        hosts: fakeTopology.hosts.map((h) => ({ ...h, ipv4: [...h.ipv4] })),
        links: fakeTopology.links.map((l) => ({ ...l })),
      };
    }
    throw err;
  }
}

async function getSwitches() {
  try {
    const raw = await sdnClient.fetchSwitches();
    const mapped = mapRyuSwitches(raw);
    if (mapped.length > 0) {
      return mapped;
    }
  } catch (err) {
    if (!(err instanceof SdnControllerError)) {
      throw err;
    }
  }
  return fakeSwitches.map((s) => ({ ...s }));
}

module.exports = {
  getTopology,
  getSwitches,
};

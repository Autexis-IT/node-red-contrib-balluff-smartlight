const smartlight = require("../../lib");

module.exports = function (RED) {
    function BalluffSmartlightController(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        const resendIntervalMs = parseInt(config.interval);
        if (isNaN(resendIntervalMs)) {
            node.error("invalid resend interval");
            return;
        }

        let activeSmartlightConfig = undefined;
        let lastError = undefined;

        const updateStatusIcon = () => {
            if (lastError !== undefined) {
                node.status({ fill: "red", shape: "ring", text: "error" });
                return;
            }

            if (activeSmartlightConfig !== undefined) {
                node.status({ fill: "green", shape: "dot", text: "controlling" });
                return;
            }

            node.status({ fill: "gray", shape: "dot", text: "waiting" });
        };

        updateStatusIcon();

        const maybeSendActiveConfig = () => {
            if (activeSmartlightConfig === undefined) {
                return;
            }

            node.send({
                payload: activeSmartlightConfig
            });
        };

        let resendIntervalHandle = undefined;

        const restartResendInterval = () => {
            if (resendIntervalHandle !== undefined) {
                clearInterval(resendIntervalHandle);
            }

            resendIntervalHandle = setInterval(() => {
                maybeSendActiveConfig();
            }, resendIntervalMs);
        };

        node.on("input", (inputMessage) => {

            let payload = undefined;
            let error = undefined;

            try {
                payload = smartlight.segmentMode().configBytesFor(inputMessage.payload);
            } catch (ex) {
                error = ex;
            }

            lastError = error;
            activeSmartlightConfig = payload;

            if (error) {
                node.error(error, error);
            }

            maybeSendActiveConfig();
            restartResendInterval();

            updateStatusIcon();
        });

        node.on("close", () => {
            if (resendIntervalHandle !== undefined) {
                clearInterval(resendIntervalHandle);
                resendIntervalHandle = undefined;
            }
        });
    }

    RED.nodes.registerType("balluff-smartlight-controller", BalluffSmartlightController);
}

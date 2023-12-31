import React, { useState, useEffect, ChangeEvent } from "react";
import Head from "next/head";
import { NextPage } from "next";
import { Box } from "@mui/material";
import styles from "../../../../components/Event/Style/captureDetails.module.scss";
import { gql } from "@apollo/client";
import client from "../../../../apolloClient";
import InputField from "../../../../components/InputField/InputField";
import ErrorBox from "../../../../components/ErrorBox/ErrorBox";
import { withLayout } from "../../../../components/Layout/withLayout";
import moment from "moment";
import Loader2 from "../../../../components/Loader/Loader2";
import { useUser } from "../../../../components/Authenticate/UserContext";

const Form1: NextPage = () => {
    const [form, setForm] = useState<{
        meetingId: string;
    }>({
        meetingId: "",
    });
    const [button1, setButton1] = useState({
        btnText: "Submit",
        disabled: true,
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const { user } = useUser();

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        if (name === "meetingId" && !value.match(/^\d*$/)) {
            return;
        }
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setButton1({ btnText: "Submitting...", disabled: true });
        const currentDate = new Date();
        const currentDateInUTC = new Date(currentDate.getTime() + currentDate.getTimezoneOffset() * 60000);
        try {
            const hasuraRes = await client.mutate({
                variables: {
                    meetingId: form.meetingId,
                    startTime: moment(currentDateInUTC).format("YYYY-MM-DD HH:mm:ss"),
                },
                mutation: gql`
                    mutation delete_MeetingDetails($meetingId: bigint, $startTime: timestamptz) {
                        delete_MeetingDetails(
                            where: { meetingId: { _eq: $meetingId }, startTime: { _gt: $startTime } }
                        ) {
                            affected_rows
                        }
                    }
                `,
            });
            const hasuraData = await hasuraRes.data;
            const deleteMeetingDetail = await hasuraData.delete_MeetingDetails;
            setButton1({ btnText: "Submit", disabled: false });
            setForm({ meetingId: "" });
            setSuccessMessage(`Successful, No of affected rows: ${deleteMeetingDetail.affected_rows}`);
        } catch (error) {
            setErrorMessage("Something went wrong.");
            setButton1({ btnText: "Submit", disabled: false });
        }
    };

    useEffect(() => {
        if (form.meetingId !== "") setButton1({ ...button1, disabled: false });
        else setButton1({ ...button1, disabled: true });
    }, [form]);

    if (user.email || user.phone_number) {
        return (
            <Box sx={{ flexGrow: 1, p: { xs: "16px" } }}>
                <Head>
                    <title>Form1</title>
                    <meta name="description" content="Generated by create next app" />
                    <link
                        rel="icon"
                        href="https://images.prismic.io/loop-web-members/4df527d2-6dfb-4c78-9499-a0facef03af3_looptech.webp?auto=compress,format"
                    />
                </Head>
                <div className={styles["capture-details"]}>
                    <div className={styles["capture-details-form"]}>
                        <InputField
                            id="meetingId"
                            name="meetingId"
                            type="text"
                            value={form.meetingId}
                            placeholder="Enter meeting id"
                            handleChange={handleChange}
                            label="Meeting Number"
                            required={true}
                        />
                        <ErrorBox successMessage={successMessage} errorMessage={errorMessage} alignment="center" />
                        <div className={styles["capture-details-submit"]}>
                            <button type="submit" disabled={button1.disabled} onClick={handleSubmit}>
                                {button1.btnText}
                            </button>
                        </div>
                    </div>
                </div>
            </Box>
        );
    }
    return <Loader2 />;
};

export default withLayout(Form1);

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import Button from '@material-ui/core/Button';

import NavbarApplicant from '../templates/NavbarApplicant';
import GetUser from "../../context/getUser";

function MyApplications(props) {
    const user = GetUser();
    const [fetchedJobs, setJobs] = useState([]);

    useEffect(() => {
        let isMounted = true; // Track if the component is mounted

        if (user.jobsApplied && user.jobsApplied.length > 0) {
            axios.post('http://localhost:4000/job/getJobs', { jobIds: user.jobsApplied })
                .then(res => {
                    if (isMounted) {
                        setJobs(res.data.jobs); // Only update state if the component is mounted
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        }

        return () => {
            isMounted = false; // Cleanup: set isMounted to false when the component unmounts
        };
    }, [user.jobsApplied]); // Only run this effect when jobsApplied changes

    const submitRating = (jobId) => {
        props.history.push('/rate-job/' + jobId);
    };

    return (
        <div className="container">
            <NavbarApplicant /> <br />
            {user.jobsApplied && user.jobsApplied.length !== 0 ? (
                <Grid container>
                    <Grid item xs={12} md={12} lg={12}>
                        <Paper>
                            <Table size="large">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Date of Joining</TableCell>
                                        <TableCell>Salary (per month)</TableCell>
                                        <TableCell>Recruiter Name</TableCell>
                                        <TableCell>Job Status</TableCell>
                                        <TableCell>Rate Job</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fetchedJobs && fetchedJobs.map((fetchedJob, ind) => (
                                        <TableRow key={ind}>
                                            <TableCell>{fetchedJob ? fetchedJob.title : ""}</TableCell>
                                            <TableCell>
                                                {fetchedJob && fetchedJob.receivedApplicants && fetchedJob.receivedApplicants.map((bJob) => (
                                                    bJob.email === user.email ? bJob.dateOfJoining && bJob.dateOfJoining.split("T")[0] : ""
                                                ))}
                                            </TableCell>
                                            <TableCell>{fetchedJob ? fetchedJob.salary : ""}</TableCell>
                                            <TableCell>{fetchedJob ? fetchedJob.name : ""}</TableCell>
                                            <TableCell>
                                                {fetchedJob && fetchedJob.receivedApplicants && fetchedJob.receivedApplicants.map((bJob) => (
                                                    bJob.email === user.email ? bJob.status : ""
                                                ))}
                                            </TableCell>
                                            <TableCell>
                                                {fetchedJob && fetchedJob.receivedApplicants && fetchedJob.receivedApplicants.map((bJob) => (
                                                    bJob.email === user.email && bJob.status === "Accepted" ?
                                                        <Button onClick={() => submitRating(fetchedJob._id)}>Rate</Button> : ""
                                                ))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                </Grid>
            ) : "You have no applications currently"}
        </div>
    );
}

export default MyApplications;

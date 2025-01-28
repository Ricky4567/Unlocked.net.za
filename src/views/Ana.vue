<template>
    <div class="chart-container">

      <div class="user-count white--text">
        <h1>Total Users: {{ totalUsers }}</h1>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, collection, getDocs } from "firebase/firestore";
  import { firebaseApp } from "../firebaseConfig";
  import VueApexCharts from "vue-apexcharts";
  
  export default {
    name: "UserTrackingChart",
    components: {
      apexchart: VueApexCharts,
    },
    data() {
      return {
        chartOptions: {
          chart: {
            id: "user-route-chart",
            toolbar: {
              show: false,
            },
          },
          xaxis: {
            categories: [],  // This will hold the route names (e.g., "/home", "/about")
            title: {
              text: "Routes",
            },
          },
          yaxis: {
            title: {
              text: "Visits",
            },
          },
          title: {
            text: "User Navigation Tracking",
            align: "center",
          },
        },
        chartSeries: [
          {
            name: "Visits",
            data: [],  // This will hold the visit counts
          },
        ],
        totalUsers: 0,  // To display the total number of users
      };
    },
    created() {
      this.fetchUserData();
    },
    methods: {
      async fetchUserData() {
        const db = getFirestore(firebaseApp);
        const usersRef = collection(db, "data");
        const snapshot = await getDocs(usersRef);
  
        const routeCounts = {};
        let userCount = 0;
  
        snapshot.forEach((doc) => {
          userCount++;
          const data = doc.data();
          const routes = data.routes;
  
          if (routes) {
            for (const [route, count] of Object.entries(routes)) {
              if (routeCounts[route]) {
                routeCounts[route] += count;
              } else {
                routeCounts[route] = count;
              }
            }
          }
        });
  
        this.updateChart(routeCounts, userCount);
      },
      updateChart(routeCounts, userCount) {
        const routes = Object.keys(routeCounts);  // Array of route names (paths)
        const counts = Object.values(routeCounts);  // Array of visit counts
  
        this.chartOptions.xaxis.categories = routes;  // Set the route names as categories
        this.chartSeries = [
          {
            name: "Visits",
            data: counts,  // Set the visit counts
          },
        ];
        this.totalUsers = userCount;  // Set the total number of users
      },
    },
  };
  </script>
  
  <style scoped>
  .chart-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .user-count {
    text-align: center;
    font-size: 1.2em;
    margin-top: 20px;
  }
  </style>
  
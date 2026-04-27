import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcZZk5MAtLY0BfOcx2Bx7ur_gA0z-JyiE",
  authDomain: "fitness-5062f.firebaseapp.com",
  projectId: "fitness-5062f",
  storageBucket: "fitness-5062f.firebasestorage.app",
  messagingSenderId: "903527577858",
  appId: "1:903527577858:web:90c2d23deeecd85eef2a1b",
  measurementId: "G-QN5F9DM0P1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = "andres";

const profileRef = doc(db, "fittrack", USER_ID, "data", "profile");
const dailyRef = collection(db, "fittrack", USER_ID, "dailyRecords");
const activitiesRef = collection(db, "fittrack", USER_ID, "activities");

const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

const profileForm = document.getElementById("profileForm");
const dailyForm = document.getElementById("dailyForm");
const activityForm = document.getElementById("activityForm");

const today = new Date().toISOString().split("T")[0];

let editingDailyId = null;
let editingActivityId = null;

let profile = {};
let dailyRecords = [];
let activities = [];

document.getElementById("dailyDate").value = today;
document.getElementById("activityDate").value = today;

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    openSection(button.dataset.section);
  });
});

profileForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  profile = {
    name: document.getElementById("name").value,
    weight: Number(document.getElementById("weight").value),
    height: Number(document.getElementById("height").value),
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    activityLevel: Number(document.getElementById("activityLevel").value),
    goal: document.getElementById("goal").value,
    targetWeight: Number(document.getElementById("targetWeight").value),
    updatedAt: new Date().toISOString()
  };

  await setDoc(profileRef, profile);
  showToast("Perfil actualizado", "Tus datos se guardaron correctamente.", "success");
});

dailyForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = editingDailyId || crypto.randomUUID();

  const record = {
    id,
    date: document.getElementById("dailyDate").value,
    weight: Number(document.getElementById("dailyWeight").value),
    bmi: Number(document.getElementById("bmi").value),
    bodyFatPercent: Number(document.getElementById("bodyFatPercent").value),
    musclePercent: Number(document.getElementById("musclePercent").value),
    visceralFat: Number(document.getElementById("visceralFat").value),
    watchCalories: Number(document.getElementById("watchCalories").value),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(dailyRef, id), record);

  editingDailyId = null;
  dailyForm.reset();
  document.getElementById("dailyDate").value = today;
  document.querySelector("#dailyForm button").textContent = "Guardar registro corporal";

  showToast("Registro guardado", "Tu registro corporal se guardó correctamente.", "success");
});

activityForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = editingActivityId || crypto.randomUUID();

  const activity = {
    id,
    date: document.getElementById("activityDate").value,
    type: document.getElementById("activityType").value,
    minutes: Number(document.getElementById("minutes").value),
    calories: Number(document.getElementById("activityCalories").value),
    distance: Number(document.getElementById("distance").value),
    notes: document.getElementById("activityNotes").value,
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(activitiesRef, id), activity);

  editingActivityId = null;
  activityForm.reset();
  document.getElementById("activityDate").value = today;
  document.querySelector("#activityForm button").textContent = "Guardar actividad";

  showToast("Actividad guardada", "Tu actividad física se guardó correctamente.", "success");
});

onSnapshot(profileRef, snapshot => {
  if (snapshot.exists()) {
    profile = snapshot.data();
    loadProfile();
    render();
  }
});

onSnapshot(query(dailyRef, orderBy("date", "desc")), snapshot => {
  dailyRecords = snapshot.docs.map(doc => doc.data());
  render();
});

onSnapshot(query(activitiesRef, orderBy("date", "desc")), snapshot => {
  activities = snapshot.docs.map(doc => doc.data());
  render();
});

function calculateDailyCalories() {
  if (!profile.weight || !profile.height || !profile.age) return 0;

  let bmr;

  if (profile.gender === "male") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  return Math.round(bmr * profile.activityLevel);
}

function loadProfile() {
  document.getElementById("name").value = profile.name || "";
  document.getElementById("weight").value = profile.weight || "";
  document.getElementById("height").value = profile.height || "";
  document.getElementById("age").value = profile.age || "";
  document.getElementById("gender").value = profile.gender || "male";
  document.getElementById("activityLevel").value = profile.activityLevel || 1.2;
  document.getElementById("goal").value = profile.goal || "lose-fat";
  document.getElementById("targetWeight").value = profile.targetWeight || "";

  if (profile.weight) {
    document.getElementById("dailyWeight").value = profile.weight;
  }
}

function render() {
  renderDashboard();
  renderAdvancedStats();
  renderDailyTable();
  renderActivityTable();
}

function renderDashboard() {
  const latest = dailyRecords[0];

  document.getElementById("estimatedCalories").textContent = `${calculateDailyCalories()} kcal`;
  document.getElementById("dashboardWeight").textContent = latest ? `${latest.weight} kg` : `${profile.weight || 0} kg`;
  document.getElementById("totalDailyRecords").textContent = dailyRecords.length;

  const totalMinutes = activities.reduce((sum, activity) => sum + (activity.minutes || 0), 0);
  document.getElementById("totalMinutes").textContent = totalMinutes;
}

function renderAdvancedStats() {
  const currentWeightEl = document.getElementById("currentWeight");
  const weightChangeEl = document.getElementById("weightChange");
  const currentBodyFatEl = document.getElementById("currentBodyFat");
  const currentMuscleEl = document.getElementById("currentMuscle");
  const currentVisceralFatEl = document.getElementById("currentVisceralFat");
  const avgWatchCaloriesEl = document.getElementById("avgWatchCalories");
  const totalActivityCaloriesEl = document.getElementById("totalActivityCalories");
  const totalDistanceEl = document.getElementById("totalDistance");
  const favoriteActivityEl = document.getElementById("favoriteActivity");
  const lastBodySummary = document.getElementById("lastBodySummary");

  if (!dailyRecords.length) {
    currentWeightEl.textContent = "0 kg";
    weightChangeEl.textContent = "0 kg";
    currentBodyFatEl.textContent = "0%";
    currentMuscleEl.textContent = "0%";
    currentVisceralFatEl.textContent = "0";
    avgWatchCaloriesEl.textContent = "0";
    lastBodySummary.innerHTML = `<p class="empty-message">Todavía no hay registros corporales.</p>`;
  } else {
    const latest = dailyRecords[0];
    const oldest = dailyRecords[dailyRecords.length - 1];

    currentWeightEl.textContent = `${latest.weight || 0} kg`;
    weightChangeEl.textContent = `${((latest.weight || 0) - (oldest.weight || 0)).toFixed(1)} kg`;
    currentBodyFatEl.textContent = `${latest.bodyFatPercent || 0}%`;
    currentMuscleEl.textContent = `${latest.musclePercent || 0}%`;
    currentVisceralFatEl.textContent = latest.visceralFat || 0;

    const totalWatch = dailyRecords.reduce((sum, r) => sum + (r.watchCalories || 0), 0);
    avgWatchCaloriesEl.textContent = Math.round(totalWatch / dailyRecords.length);

    lastBodySummary.innerHTML = `
      <div class="summary-item">
        <span>Peso</span>
        <strong>${latest.weight || 0} kg</strong>
      </div>

      <div class="summary-item">
        <span>IMC</span>
        <strong>${latest.bmi || 0}</strong>
      </div>

      <div class="summary-item">
        <span>Grasa corporal</span>
        <strong>${latest.bodyFatPercent || 0}%</strong>
      </div>

      <div class="summary-item">
        <span>Músculo</span>
        <strong>${latest.musclePercent || 0}%</strong>
      </div>

      <div class="summary-item">
        <span>Grasa visceral</span>
        <strong>${latest.visceralFat || 0}</strong>
      </div>

        <div class="summary-item">
        <span>Calorías estimadas</span>
        <strong>${calculateDailyCalories()} kcal</strong>
        </div>
    `;
  }

  const totalActivityCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);
  totalActivityCaloriesEl.textContent = totalActivityCalories;

  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
  totalDistanceEl.textContent = `${totalDistance.toFixed(2)} km`;

  const activityCount = {};

  activities.forEach(activity => {
    activityCount[activity.type] = (activityCount[activity.type] || 0) + 1;
  });

  const favorite = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0];
  favoriteActivityEl.textContent = favorite ? favorite[0] : "-";
}

function renderDailyTable() {
  const dailyTable = document.getElementById("dailyTable");
  dailyTable.innerHTML = "";

  dailyRecords.forEach(record => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatDate(record.date)}</td>
      <td>${record.weight || 0} kg</td>
      <td>${record.bmi || 0}</td>
      <td>${record.bodyFatPercent || 0}%</td>
      <td>${record.musclePercent || 0}%</td>
      <td>${record.watchCalories || 0} kcal</td>
      <td class="actions">
        <button class="edit-btn" onclick="editDailyRecord('${record.id}')">Editar</button>
        <button class="delete-btn" onclick="deleteDailyRecord('${record.id}')">Eliminar</button>
      </td>
    `;

    dailyTable.appendChild(tr);
  });
}

function renderActivityTable() {
  const activityTable = document.getElementById("activityTable");
  activityTable.innerHTML = "";

  activities.forEach(activity => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatDate(activity.date)}</td>
      <td>${activity.type}</td>
      <td>${activity.minutes || 0}</td>
      <td>${activity.calories || 0} kcal</td>
      <td>${activity.distance || 0} km</td>
      <td>${activity.notes || "-"}</td>
      <td class="actions">
        <button class="edit-btn" onclick="editActivity('${activity.id}')">Editar</button>
        <button class="delete-btn" onclick="deleteActivity('${activity.id}')">Eliminar</button>
      </td>
    `;

    activityTable.appendChild(tr);
  });
}

window.editDailyRecord = function (id) {
  const record = dailyRecords.find(item => item.id === id);
  if (!record) return;

  editingDailyId = id;

  document.getElementById("dailyDate").value = record.date;
  document.getElementById("dailyWeight").value = record.weight || "";
  document.getElementById("bmi").value = record.bmi || "";
  document.getElementById("bodyFatPercent").value = record.bodyFatPercent || "";
  document.getElementById("musclePercent").value = record.musclePercent || "";
  document.getElementById("visceralFat").value = record.visceralFat || "";
  document.getElementById("watchCalories").value = record.watchCalories || "";
  document.querySelector("#dailyForm button").textContent = "Actualizar registro corporal";
  showToast("Registro actualizado", "Los cambios se guardaron correctamente.", "success");
  openSection("daily");
};

window.editActivity = function (id) {
  const activity = activities.find(item => item.id === id);
  if (!activity) return;

  editingActivityId = id;

  document.getElementById("activityDate").value = activity.date;
  document.getElementById("activityType").value = activity.type;
  document.getElementById("minutes").value = activity.minutes || "";
  document.getElementById("activityCalories").value = activity.calories || "";
  document.getElementById("distance").value = activity.distance || "";
  document.getElementById("activityNotes").value = activity.notes || "";

  document.querySelector("#activityForm button").textContent = "Actualizar actividad";
  showToast("Actividad actualizada", "Los cambios se guardaron correctamente.", "success");
  openSection("activity");
};

window.deleteDailyRecord = async function (id) {
  const confirmed = await showConfirmModal(
    "Eliminar registro corporal",
    "Esta acción eliminará el registro permanentemente."
  );

  if (!confirmed) return;

  await deleteDoc(doc(dailyRef, id));

  showToast("Registro eliminado", "El registro corporal fue eliminado.", "info");
};

window.deleteActivity = async function (id) {
  const confirmed = await showConfirmModal(
    "Eliminar actividad",
    "Esta acción eliminará la actividad permanentemente."
  );

  if (!confirmed) return;

  await deleteDoc(doc(activitiesRef, id));

  showToast("Actividad eliminada", "La actividad física fue eliminada.", "info");
};

function openSection(sectionId) {
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionId);
  });

  pages.forEach(page => {
    page.classList.toggle("active", page.id === sectionId);
  });
}

function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showToast(title, message, type = "success") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  toast.innerHTML = `
    <strong>${title}</strong>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(18px)";

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2800);
}

function showConfirmModal(title, message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirmModal");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const cancelBtn = document.getElementById("cancelConfirm");
    const acceptBtn = document.getElementById("acceptConfirm");

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.classList.add("active");

    const close = result => {
      modal.classList.remove("active");

      cancelBtn.onclick = null;
      acceptBtn.onclick = null;

      resolve(result);
    };

    cancelBtn.onclick = () => close(false);
    acceptBtn.onclick = () => close(true);
  });
}
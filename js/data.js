/* Shared StayFlow data store. The mock JSON is the only source used to seed it. */
(function (root) {
  "use strict";

  const STORAGE_KEY = "sf_db";
  const SHIFT_NAMES = {
    morning: "Ca sáng",
    afternoon: "Ca chiều",
    day: "Ca ngày",
    evening: "Ca chiều",
    night: "Ca đêm",
  };
  const DEPARTMENT_NAMES = {
    Housekeeping: "Buồng phòng",
    Engineering: "Kỹ thuật",
    "Food & Beverage": "Ẩm thực",
    "Room Service": "Ẩm thực",
    "Front Desk": "Lễ tân",
    Operations: "Vận hành",
    Administration: "Quản trị",
  };
  const REQUEST_STATUS = {
    new: "Chờ xử lý",
    assigned: "Đang thực hiện",
    in_progress: "Đang thực hiện",
    waiting_guest: "Đang chờ khách",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  const TASK_STATUS = {
    assigned: "Chờ nhận",
    in_progress: "Đang làm",
    waiting_guest: "Chờ khách",
    completed: "Hoàn tất",
  };
  const PRIORITY = { high: "Cao", normal: "Trung bình", low: "Thấp" };

  function requireLists(source) {
    const names = ["staff", "serviceTypes", "stays", "requests", "tasks", "feedback"];
    if (!source || typeof source !== "object" || names.some((name) => !Array.isArray(source[name]))) {
      throw new Error("stayflow.mock.json phải có các danh sách staff, serviceTypes, stays, requests, tasks và feedback.");
    }
  }

  function indexById(items, name) {
    const index = new Map();
    items.forEach((item) => {
      if (!item || typeof item.id !== "string" || !item.id.trim() || index.has(item.id)) {
        throw new Error("ID bị thiếu hoặc trùng trong danh sách " + name + ": " + (item && item.id));
      }
      index.set(item.id, item);
    });
    return index;
  }

  function validateSource(source) {
    requireLists(source);
    const indexes = {};
    ["staff", "serviceTypes", "stays", "requests", "tasks", "feedback"].forEach((name) => {
      indexes[name] = indexById(source[name], name);
    });
    source.requests.forEach((request) => {
      if (!indexes.stays.has(request.stayId) || !indexes.serviceTypes.has(request.serviceTypeId)) {
        throw new Error("Yêu cầu " + request.id + " tham chiếu đến lưu trú hoặc dịch vụ không tồn tại.");
      }
      if (request.assignedStaffId && !indexes.staff.has(request.assignedStaffId)) {
        throw new Error("Yêu cầu " + request.id + " tham chiếu đến nhân viên không tồn tại: " + request.assignedStaffId);
      }
      if (!REQUEST_STATUS[request.status] || !PRIORITY[request.priority]) {
        throw new Error("Yêu cầu " + request.id + " có trạng thái hoặc mức ưu tiên không được hỗ trợ.");
      }
      if (!Number.isFinite(Date.parse(request.createdAt)) ||
          (request.dueAt !== null && request.dueAt !== undefined && !Number.isFinite(Date.parse(request.dueAt)))) {
        throw new Error("Yêu cầu " + request.id + " có thời điểm tạo hoặc hạn xử lý không hợp lệ.");
      }
    });
    source.tasks.forEach((task) => {
      if (!indexes.requests.has(task.requestId) || (task.assignedTo && !indexes.staff.has(task.assignedTo))) {
        throw new Error("Nhiệm vụ " + task.id + " tham chiếu đến yêu cầu hoặc nhân viên không tồn tại.");
      }
      if (!TASK_STATUS[task.status]) {
        throw new Error("Nhiệm vụ " + task.id + " có trạng thái không được hỗ trợ: " + task.status);
      }
    });
    source.feedback.forEach((entry) => {
      if (!indexes.stays.has(entry.stayId) || (entry.requestId && !indexes.requests.has(entry.requestId))) {
        throw new Error("Phản hồi " + entry.id + " tham chiếu đến lưu trú hoặc yêu cầu không tồn tại.");
      }
    });
    source.stays.forEach((stay) => {
      if (!["checked_in", "checked_out"].includes(stay.status)) {
        throw new Error("Lưu trú " + stay.id + " có trạng thái không được hỗ trợ: " + stay.status);
      }
    });
    return indexes;
  }

  function validateDatabase(data) {
    const names = ["staff", "shifts", "serviceTypes", "stays", "requests", "tasks", "feedback", "users", "audit"];
    if (!data || typeof data !== "object" || names.some((name) => !Array.isArray(data[name]))) {
      throw new Error("Dữ liệu StayFlow đã lưu thiếu một hoặc nhiều danh sách bắt buộc.");
    }
    const indexes = {};
    ["staff", "serviceTypes", "stays", "requests", "tasks", "feedback"].forEach((name) => {
      indexes[name] = indexById(data[name], name);
    });
    data.requests.forEach((request) => {
      if (!indexes.stays.has(request.stayId) || !indexes.serviceTypes.has(request.serviceTypeId)) {
        throw new Error("Yêu cầu " + request.id + " tham chiếu đến lưu trú hoặc dịch vụ không tồn tại.");
      }
      if (request.assignedStaffId && !indexes.staff.has(request.assignedStaffId)) {
        throw new Error("Yêu cầu " + request.id + " tham chiếu đến nhân viên không tồn tại.");
      }
      if (!["Chờ xử lý", "Đang thực hiện", "Đang chờ khách", "Hoàn thành", "Đã hủy"].includes(request.status) ||
          !Object.values(PRIORITY).includes(request.priority)) {
        throw new Error("Yêu cầu " + request.id + " có trạng thái hoặc mức ưu tiên không hợp lệ.");
      }
    });
    data.tasks.forEach((task) => {
      if (!indexes.requests.has(task.requestId) || (task.staffId && !indexes.staff.has(task.staffId))) {
        throw new Error("Nhiệm vụ " + task.id + " tham chiếu đến yêu cầu hoặc nhân viên không tồn tại.");
      }
      if (!Object.values(TASK_STATUS).includes(task.status) && task.status !== "Chờ nhận") {
        throw new Error("Nhiệm vụ " + task.id + " có trạng thái không hợp lệ: " + task.status);
      }
    });
    data.feedback.forEach((entry) => {
      if (!indexes.stays.has(entry.stayId) || (entry.requestId && !indexes.requests.has(entry.requestId))) {
        throw new Error("Phản hồi " + entry.id + " tham chiếu đến lưu trú hoặc yêu cầu không tồn tại.");
      }
    });
    return data;
  }

  function convertMockData(source) {
    const indexes = validateSource(source);
    const data = {
      schemaVersion: 1,
      clock: source.meta && source.meta.updatedAt,
      staff: source.staff.filter((person) => person.role === "staff").map((person) => {
        if (!SHIFT_NAMES[person.shift] || !["on_duty", "off_duty"].includes(person.status)) {
          throw new Error("Nhân viên " + person.id + " có ca hoặc trạng thái không được hỗ trợ.");
        }
        return {
          id: person.id,
          name: person.name,
          email: person.email,
          phone: person.phone,
          role: DEPARTMENT_NAMES[person.department] || person.department,
          department: DEPARTMENT_NAMES[person.department] || person.department,
          shift: SHIFT_NAMES[person.shift],
          status: person.status === "on_duty" ? "Đang trực" : "Nghỉ",
        };
      }),
      shifts: [
        { id: "morning", name: "Ca sáng", start: "06:00", end: "14:00" },
        { id: "afternoon", name: "Ca chiều", start: "14:00", end: "22:00" },
        { id: "night", name: "Ca đêm", start: "22:00", end: "06:00" },
      ],
      serviceTypes: source.serviceTypes.map((service) => ({
        id: service.id,
        categoryName: service.name,
        description: service.description,
        department: DEPARTMENT_NAMES[service.department] || service.department,
        expectedSLA: service.defaultSlaMinutes,
        priority: "Trung bình",
        active: service.isActive,
        icon: service.icon,
      })),
      stays: source.stays.map((stay) => ({
        id: stay.id,
        guestId: stay.guestId,
        guestName: stay.guestName,
        guestEmail: stay.guestEmail,
        guestPhone: stay.guestPhone,
        roomNumber: stay.roomNumber,
        roomType: stay.roomType,
        checkInAt: stay.checkInAt,
        checkOutAt: stay.checkOutAt,
        status: stay.status === "checked_in" ? "Đang lưu trú" : "Đã trả phòng",
        isVip: stay.isVip,
      })),
      requests: source.requests.map((request) => ({
        id: request.id,
        stayId: request.stayId,
        serviceTypeId: request.serviceTypeId,
        title: request.title,
        content: request.description,
        description: request.description,
        status: REQUEST_STATUS[request.status],
        priority: PRIORITY[request.priority],
        source: request.source,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        dueAt: request.dueAt,
        assignedStaffId: request.assignedStaffId,
        notes: request.notes || "",
        ai_priority_reason: (source.aiMocks && source.aiMocks.priorityAssistant || [])
          .find((item) => item.requestId === request.id)?.reason || request.notes || "",
      })),
      tasks: source.tasks.map((task) => {
        const request = indexes.requests.get(task.requestId);
        return {
          id: task.id,
          requestId: task.requestId,
          staffId: task.assignedTo,
          status: TASK_STATUS[task.status],
          priority: PRIORITY[request.priority],
          ai_priority_reason: (source.aiMocks && source.aiMocks.priorityAssistant || [])
            .find((item) => item.requestId === task.requestId)?.reason || request.notes || "",
          assignedAt: task.createdAt,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          checklist: task.checklist || [],
          internalNote: task.internalNote || "",
        };
      }),
      feedback: source.feedback.map((entry) => ({ ...entry })),
      users: Array.isArray(source.users) ? source.users.map((user) => ({ ...user })) : [],
      audit: [],
      feedbackSummary: source.aiMocks && source.aiMocks.feedbackSummarizer
        ? source.aiMocks.feedbackSummarizer.summary || ""
        : "",
    };
    return validateDatabase(data);
  }

  function migrateSaved(saved, initial, source) {
    if (!saved || typeof saved !== "object") {
      throw new Error("Dữ liệu StayFlow đã lưu không phải là đối tượng hợp lệ.");
    }
    const mergeRecords = (defaults, values) => (values || defaults).map((record) => ({
      ...(defaults.find((item) => item.id === record.id) || {}),
      ...record,
    }));
    const migrated = {
      ...initial,
      ...saved,
      schemaVersion: 1,
      staff: mergeRecords(initial.staff, saved.staff),
      shifts: mergeRecords(initial.shifts, saved.shifts),
      serviceTypes: mergeRecords(initial.serviceTypes, saved.serviceTypes),
      stays: mergeRecords(initial.stays, saved.stays),
      requests: mergeRecords(initial.requests, saved.requests),
      tasks: mergeRecords(initial.tasks, saved.tasks),
      feedback: mergeRecords(initial.feedback, saved.feedback),
      users: saved.users || initial.users,
      audit: saved.audit || [],
    };
    const mockIds = new Set(source.staff.map((person) => person.id)
      .concat(initial.stays.map((stay) => stay.guestId)));
    migrated.users = migrated.users.filter((user) => !mockIds.has(user.id));
    return validateDatabase(migrated);
  }

  function createBrowserStore(initial) {
    let data = initial;
    const clockStartedAt = Date.now();
    const clockOrigin = Date.parse(initial.clock) || clockStartedAt;
    const currentClock = () => new Date(clockOrigin + Date.now() - clockStartedAt).toISOString();

    function save(next) {
      validateDatabase(next);
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      data = next;
      root.StayFlowData = data;
      root.dispatchEvent(new Event("stayflow:data-changed"));
      return data;
    }

    function nextRequestId() {
      const max = data.requests.reduce((highest, request) => {
        const match = /^REQ-\d{4}-(\d+)$/.exec(request.id);
        return match ? Math.max(highest, Number(match[1])) : highest;
      }, 0);
      return "REQ-" + new Date().getFullYear() + "-" + String(max + 1).padStart(4, "0");
    }

    function createRequest(input) {
      const service = data.serviceTypes.find((item) => item.id === input.serviceTypeId);
      const stay = data.stays.find((item) => item.id === input.stayId);
      if (!service || !stay) throw new Error("Không thể tạo yêu cầu: lưu trú hoặc loại dịch vụ không tồn tại.");
      const latestRequestAt = data.requests.reduce((latest, request) => {
        const createdAt = Date.parse(request.createdAt);
        return Number.isFinite(createdAt) ? Math.max(latest, createdAt) : latest;
      }, 0);
      const now = new Date(Math.max(Date.parse(currentClock()), latestRequestAt + 1)).toISOString();
      const id = input.id || nextRequestId();
      if (data.requests.some((item) => item.id === id)) throw new Error("Mã yêu cầu đã tồn tại: " + id);
      const request = {
        id,
        stayId: stay.id,
        serviceTypeId: service.id,
        title: String(input.title || service.categoryName).trim(),
        content: String(input.description || "").trim(),
        description: String(input.description || "").trim(),
        status: "Chờ xử lý",
        priority: input.priority || service.priority || "Trung bình",
        source: "guest_portal",
        createdAt: now,
        updatedAt: now,
        dueAt: new Date(Date.parse(now) + Number(service.expectedSLA) * 60000).toISOString(),
        assignedStaffId: null,
        notes: "",
        ai_priority_reason: "",
      };
      data.requests.push(request);
      save(data);
      return request;
    }

    function updateGuestRequest(input) {
      const id = String(input.id || input.code || "").replace(/^#/, "");
      const request = data.requests.find((item) => item.id === id);
      if (!request) throw new Error("Không tìm thấy yêu cầu cần cập nhật: " + id);
      const statuses = { in_progress: "Đang thực hiện", completed: "Hoàn thành", cancelled: "Đã hủy" };
      if (input.status && !statuses[input.status]) throw new Error("Trạng thái yêu cầu không được hỗ trợ: " + input.status);
      if (input.status) request.status = statuses[input.status];
      if (input.note !== undefined) request.content = request.description = String(input.note);
      request.updatedAt = currentClock();
      save(data);
      return request;
    }

    function updateStaffTask(taskId, status, staffId, note) {
      const task = data.tasks.find((item) => item.id === taskId);
      if (!task) throw new Error("Không tìm thấy nhiệm vụ cần cập nhật: " + taskId);
      const statuses = { new: "assigned", processing: "in_progress", completed: "completed" };
      const labels = { assigned: "Chờ nhận", in_progress: "Đang làm", completed: "Hoàn tất" };
      if (!statuses[status]) throw new Error("Trạng thái nhiệm vụ không được hỗ trợ: " + status);
      if (staffId && !data.staff.some((person) => person.id === staffId)) {
        throw new Error("Không tìm thấy nhân viên được phân công: " + staffId);
      }
      task.status = labels[statuses[status]];
      if (staffId) task.staffId = staffId;
      if (note !== undefined) task.internalNote = String(note);
      if (status === "completed") task.completedAt = currentClock();
      const request = data.requests.find((item) => item.id === task.requestId);
      request.status = status === "completed" ? "Hoàn thành" : "Đang thực hiện";
      request.assignedStaffId = task.staffId || null;
      request.updatedAt = currentClock();
      save(data);
      return task;
    }

    return {
      getData: () => data,
      save,
      createRequest,
      updateGuestRequest,
      updateStaffTask,
      nextRequestId,
      reset() {
        root.localStorage.removeItem(STORAGE_KEY);
        root.location.reload();
      },
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = convertMockData(require("../assets/data/stayflow.mock.json"));
  }

  if (typeof window !== "undefined" && typeof document !== "undefined" &&
      document.currentScript && document.currentScript.src && typeof window.fetch === "function") {
    const script = document.currentScript;
    const jsonUrl = new URL("../assets/data/stayflow.mock.json", script.src);
    window.StayFlowData = null;
    window.StayFlowMockData = null;
    window.StayFlowStore = null;
    window.StayFlowDataReady = window.fetch(jsonUrl)
      .then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then((source) => {
        const initial = convertMockData(source);
        let data = initial;
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          try {
            data = migrateSaved(JSON.parse(saved), initial, source);
          } catch (error) {
            console.error("Dữ liệu StayFlow trong trình duyệt không hợp lệ:", error);
            throw new Error("Dữ liệu đã lưu không hợp lệ. Hãy đặt lại dữ liệu mẫu rồi tải lại trang.", { cause: error });
          }
        }
        window.StayFlowMockData = source;
        window.StayFlowData = data;
        window.StayFlowStore = createBrowserStore(data);
        return data;
      })
      .catch((error) => {
        console.error("Không thể khởi tạo dữ liệu StayFlow:", error);
        throw error;
      });
  }
})(typeof self !== "undefined" ? self : this);

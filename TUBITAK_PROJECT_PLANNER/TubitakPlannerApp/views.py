from django.http import JsonResponse
from rest_framework.parsers import JSONParser
from .models import User, WorkPackage, Task, Project, Deliverable, BudgetEntry
from .serializers import ProjectLeadRegistrationSerializer, UserSerializer, WorkPackageSerializer, TaskSerializer, ProjectSerializer, DeliverableSerializer, BudgetEntrySerializer
from django.views.decorators.csrf import csrf_exempt

from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from functools import wraps

# DECORATOR FOR FORCING JWT AUTH
def jwt_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Authentication credentials were not provided.'}, status=401)

        token = auth_header.split(' ')[1]
        jwt_auth = JWTAuthentication()

        try:
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            request.user = user  # attach user to request
        except (InvalidToken, TokenError) as e:
            return JsonResponse({'error': 'Invalid or expired token.'}, status=401)

        return view_func(request, *args, **kwargs)
    return _wrapped_view

# HELPER FOR GETTING CURRENT PROJECT
def get_current_project(request):
    pid = request.headers.get('X-Project-Id') or request.GET.get('project_id')
    if not pid:
        return None, JsonResponse({"error": "Project context required (X-Project-Id header or ?project_id=)."}, status=400)
    try:
        proj = Project.objects.get(id=pid, owner=request.user)
    except Project.DoesNotExist:
        return None, JsonResponse({"error": "Project not found or not yours."}, status=404)

    return proj, None


# User API View
@jwt_required
@csrf_exempt
def userApi(request, id=0):
    if request.method == 'GET':
        if id == 0:
            users = User.objects.filter(project_lead=request.user).all()
            user_serializer = UserSerializer(users, many=True)
            return JsonResponse(user_serializer.data, safe=False)
        else:
            try:
                user = User.objects.get(id=id, project_lead=request.user)
                user_serializer = UserSerializer(user)
                return JsonResponse(user_serializer.data)
            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)

    elif request.method == 'POST':
        user_data = JSONParser().parse(request)
        user_serializer = UserSerializer(data=user_data)
        if user_serializer.is_valid():
            user_serializer.save(project_lead=request.user)  
            return JsonResponse({"message": "User added successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data provided. Please check the fields."}, status=400)

    elif request.method == 'PUT':
        user_data = JSONParser().parse(request)
        try:
            user = User.objects.get(id=id, project_lead=request.user)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

        user_serializer = UserSerializer(user, data=user_data)
        if user_serializer.is_valid():
            user_serializer.save(project_lead=request.user) 
            return JsonResponse({"message": "User updated successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data provided. Please check the fields."}, status=400)


    elif request.method == 'DELETE':
        try:
            user = User.objects.get(id=id, project_lead=request.user)
            user.delete()
            return JsonResponse({"message": "User deleted successfully!"}, safe=False)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)

# WorkPackage API View
@jwt_required
@csrf_exempt
def workPackageApi(request, id=0):
    project, err = get_current_project(request)
    if err: return err

    if request.method == 'GET':
        if id == 0:
            work_packages = WorkPackage.objects.filter(project=project).order_by('start_date', 'end_date')
            work_package_serializer = WorkPackageSerializer(work_packages, many=True)
            return JsonResponse(work_package_serializer.data, safe=False)
        else:
            try:
                work_package = WorkPackage.objects.get(id=id, project=project)
                work_package_serializer = WorkPackageSerializer(work_package)
                return JsonResponse(work_package_serializer.data)
            except WorkPackage.DoesNotExist:
                return JsonResponse({"error": "WorkPackage not found."}, status=404)

    elif request.method == 'POST':
        work_package_data = JSONParser().parse(request)
        work_package_data['project'] = project.id
        
        # Add users to WorkPackage
        user_ids = work_package_data.get('users', [])
        users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                users.append(user)
            except User.DoesNotExist:
                return JsonResponse({"error": f"User with ID {user_id} not found."}, status=404)

        # Serialize and save the WorkPackage
        work_package_serializer = WorkPackageSerializer(data=work_package_data)
        if work_package_serializer.is_valid():
            work_package = work_package_serializer.save()
            work_package.users.set(users)  # Associate users with the work package
            return JsonResponse({"message": "WorkPackage added successfully!"}, safe=False)
        return JsonResponse({"error": "Invalid data for work package. Please check the fields."}, status=400)

    elif request.method == 'PUT':
        work_package_data = JSONParser().parse(request)
        try:
            work_package = WorkPackage.objects.get(id=id, project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Add users to WorkPackage
        user_ids = work_package_data.get('users', [])
        users = []
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                users.append(user)
            except User.DoesNotExist:
                return JsonResponse({"error": f"User with ID {user_id} not found."}, status=404)

        work_package_data['project'] = project.id
        work_package_serializer = WorkPackageSerializer(work_package, data=work_package_data)
        if work_package_serializer.is_valid():
            work_package_serializer.save()
            work_package.users.set(users)  # Update users for the work package
            return JsonResponse({"message": "WorkPackage updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update work package."}, status=400)

    elif request.method == 'PATCH':
        work_package_data = JSONParser().parse(request)
        try:
            work_package = WorkPackage.objects.get(id=id, project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        work_package_serializer = WorkPackageSerializer(work_package, data=work_package_data, partial=True) # Use partial=True
        if work_package_serializer.is_valid():
            work_package_serializer.save()
            return JsonResponse({"message": "WorkPackage updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update work package."}, status=400)

    elif request.method == 'DELETE':
        try:
            work_package = WorkPackage.objects.get(id=id, project=project)
            work_package.delete()
            return JsonResponse({"message": "WorkPackage deleted successfully!"}, safe=False)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

# Task API View
@jwt_required
@csrf_exempt
def taskApi(request, id=0):
    project, err = get_current_project(request)
    if err: return err

    if request.method == 'GET':
        if id == 0:
            tasks = Task.objects.filter(work_package__project=project).order_by('start_date', 'end_date')
            task_serializer = TaskSerializer(tasks, many=True)
            return JsonResponse(task_serializer.data, safe=False)
        else:
            try:
                task = Task.objects.get(id=id, work_package__project=project)
                task_serializer = TaskSerializer(task)
                return JsonResponse(task_serializer.data)
            except Task.DoesNotExist:
                return JsonResponse({"error": "Invalid data for task. Please check the fields."}, status=400)


    elif request.method == 'POST':
        task_data = JSONParser().parse(request)
        
        # Validate the work package
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'], project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse({"error": "Task weeks cannot exceed WorkPackage weeks."}, status=400)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                try:
                    user = User.objects.get(id=user_id)
                    return JsonResponse({"error": f"User {user.name} is not part of the WorkPackage."}, status=400)
                except User.DoesNotExist:
                    return JsonResponse({"error": f"User with id {user_id} does not exists"}, status=404)

        # Serialize and save the Task
        task_serializer = TaskSerializer(data=task_data)
        if task_serializer.is_valid():
            task = task_serializer.save()
            task.users.set(task_users)  # Associate users with the task
            task.work_package = work_package  # Assign the task to the WorkPackage
            task.save()  # Save the changes
            return JsonResponse({"message": "Task added successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to add task."}, status=404)

    elif request.method == 'PUT':
        task_data = JSONParser().parse(request)
        try:
            task = Task.objects.get(id=id, work_package__project=project)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found."}, status=404)

        # Fetch the associated WorkPackage
        try:
            work_package = WorkPackage.objects.get(id=task_data['work_package'], project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if task's start and end weeks fall within the work package's start and end weeks
        task_start_week = int(task_data['start_date'])
        task_end_week = int(task_data['end_date'])
        wp_start_week = work_package.start_date
        wp_end_week = work_package.end_date

        if task_start_week < wp_start_week or task_end_week > wp_end_week:
            return JsonResponse({"error": "Task weeks cannot exceed WorkPackage weeks."}, status=400)

        # Validate if users are part of the work package
        wp_users = work_package.users.all().values_list('id', flat=True)
        task_users = task_data.get('users', [])

        for user_id in task_users:
            if user_id not in wp_users:
                try:
                    user = User.objects.get(id=user_id)
                    return JsonResponse({"error": f"User {user.name} is not part of the WorkPackage."}, status=400)
                except User.DoesNotExist:
                    return JsonResponse({"error": f"User with id {user_id} does not exists"}, status=404)

        task_serializer = TaskSerializer(task, data=task_data)
        if task_serializer.is_valid():
            task_serializer.save()
            return JsonResponse({"message": "Task updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update task."}, status=400)
    
    elif request.method == 'PATCH':
        task_data = JSONParser().parse(request)
        try:
            task = Task.objects.get(id=id, work_package__project=project)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found."}, status=404)
        
        task_serializer = TaskSerializer(task, data=task_data, partial=True) # Use partial=True
        if task_serializer.is_valid():
            task_serializer.save()
            return JsonResponse({"message": "Task updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update task."}, status=400)


    elif request.method == 'DELETE':
        try:
            task = Task.objects.get(id=id, work_package__project=project)
            task.delete()
            return JsonResponse({"message": "Task deleted successfully!"}, safe=False)
        except Task.DoesNotExist:
            return JsonResponse({"error": "Task not found."}, status=404)

# API FOR ALL PROJECTS
@jwt_required
@csrf_exempt
def projectApi(request, id=None):
    if request.method == 'GET':
        qs = Project.objects.filter(owner=request.user).order_by('-created_at')
        return JsonResponse(ProjectSerializer(qs, many=True).data, safe=False)
    
    if request.method == 'POST':
        data = JSONParser().parse(request)
        serializer = ProjectSerializer(data=data)

        if serializer.is_valid():
            proj = Project(owner=request.user, **serializer.validated_data)
            proj.save()
            return JsonResponse(ProjectSerializer(proj).data, status=201, safe=False)
        return JsonResponse({"error": serializer.errors}, status=400)
    
    return JsonResponse({"error": "Method not allowed."}, status=405)

#API FOR SINGLE PROJECT
@jwt_required
@csrf_exempt
def projectDetailApi(request, id):
    try:
        project = Project.objects.get(id=id, owner=request.user)
    except Project.DoesNotExist:
        return JsonResponse({"error": "Project not found or not yours."}, status=404)

    if request.method == 'GET':
        return JsonResponse(ProjectSerializer(project).data, safe=False)

    elif request.method == 'PUT':
        data = JSONParser().parse(request)
        serializer = ProjectSerializer(project, data=data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse(serializer.data, safe=False)
        return JsonResponse({"error": serializer.errors}, status=400)

    elif request.method == 'DELETE':
        project.delete()
        return JsonResponse({"message": "Project deleted successfully!"}, status=200)

    return JsonResponse({"error": "Method not allowed."}, status=405)


# Delvierable API View
@jwt_required
@csrf_exempt
def deliverableApi(request, id=0):
    project, err = get_current_project(request)
    if err: return err

    if request.method == 'GET':
        if id == 0:
            deliverables = Deliverable.objects.filter(work_package__project=project).order_by('deadline')
            deliverable_serializer = DeliverableSerializer(deliverables, many=True)
            return JsonResponse(deliverable_serializer.data, safe=False)
        else:
            try:
                deliverable = Deliverable.objects.get(id=id, work_package__project=project)
                deliverable_serializer = DeliverableSerializer(deliverable)
                return JsonResponse(deliverable_serializer.data)
            except Deliverable.DoesNotExist:
                return JsonResponse({"error": "Deliverable not found."}, status=404)

    elif request.method == 'POST':
        deliverable_data = JSONParser().parse(request)
        
        # Validate the work package
        try:
            work_package = WorkPackage.objects.get(id=deliverable_data['work_package'], project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if deliverable's deadline fall within the work package's start and end months
        deliverable_deadline = int(deliverable_data['deadline'])
        wp_start_month = work_package.start_date
        wp_end_month = work_package.end_date

        if deliverable_deadline < wp_start_month or deliverable_deadline > wp_end_month:
            return JsonResponse({"error": "Deliverable deadline cannot exceed WorkPackage months."}, status=400)

        
        # Serialize and save the Deliverable
        deliverable_serializer = DeliverableSerializer(data=deliverable_data)
        if deliverable_serializer.is_valid():
            deliverable = deliverable_serializer.save()
            deliverable.work_package = work_package  # Assign the deliverable to the WorkPackage
            deliverable.save()  # Save the changes
            return JsonResponse({"message": "Deliverable added successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to add deliverable."}, status=400)

    elif request.method == 'PUT':
        deliverable_data = JSONParser().parse(request)
        try:
            deliverable = Deliverable.objects.get(id=id, work_package__project=project)
        except Deliverable.DoesNotExist:
            return JsonResponse({"error": "Deliverable not found."}, status=404)

        # Fetch the associated WorkPackage
        try:
            work_package = WorkPackage.objects.get(id=deliverable_data['work_package'], project=project)
        except WorkPackage.DoesNotExist:
            return JsonResponse({"error": "WorkPackage not found."}, status=404)

        # Check if deliverable's deadline fall within the work package's start and end months
        deliverable_deadline = int(deliverable_data['deadline'])
        wp_start_month = work_package.start_date
        wp_end_month = work_package.end_date

        if deliverable_deadline < wp_start_month or deliverable_deadline > wp_end_month:
            return JsonResponse({"error": "Deliverable deadline cannot exceed WorkPackage months."}, status=400)

        deliverable_serializer = DeliverableSerializer(deliverable, data=deliverable_data)
        if deliverable_serializer.is_valid():
            deliverable_serializer.save()
            return JsonResponse({"message": "Deliverable updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update deliverable."}, status=400)
    
    elif request.method == 'PATCH':
        deliverable_data = JSONParser().parse(request)
        try:
            deliverable = Deliverable.objects.get(id=id, work_package__project=project)
        except Deliverable.DoesNotExist:
            return JsonResponse({"error": "Deliverable not found."}, status=404)

        deliverable_serializer = DeliverableSerializer(deliverable, data=deliverable_data, partial=True) # Use partial=True
        if deliverable_serializer.is_valid():
            deliverable_serializer.save()
            return JsonResponse({"message": "Deliverable updated successfully!"}, safe=False)
        return JsonResponse({"error": "Failed to update deliverable."}, status=400)


    elif request.method == 'DELETE':
        try:
            deliverable = Deliverable.objects.get(id=id, work_package__project=project)
            deliverable.delete()
            return JsonResponse({"message": "Deliverable deleted successfully!"}, safe=False)
        except Deliverable.DoesNotExist:
            return JsonResponse({"error": "Deliverable not found."}, status=404)

@jwt_required
@csrf_exempt
def budgetEntryApi(request):
    project, err = get_current_project(request)
    if err: return err
    
    if request.method == 'GET':
        budget_entries = BudgetEntry.objects.filter(work_package__project=project)
        budget_entry_serializer = BudgetEntrySerializer(budget_entries, many=True)
        
        # transform data for frontend compatibility (key-value pair)
        transformed_data = {}
        for entry in budget_entry_serializer.data:
            key = f"{entry['work_package']}_{entry['user']}_{entry['month']}"
            transformed_data[key] = entry['contribution']
        return JsonResponse(transformed_data, safe=False)

    elif request.method == 'POST':
        data = JSONParser().parse(request)
        
        # consider a better way to partially update the budget entries
        BudgetEntry.objects.filter(work_package__project=project).delete()
        
        saved_entries = []
        errors = []

        for key, value in data.items():
            try:
                wp_id, user_id, month = key.split('_')
                wp = WorkPackage.objects.get(id=int(wp_id), project=project)
                entry_data = {
                    'work_package': wp.id,
                    'user': int(user_id),
                    'month': int(month),
                    'contribution': value
                }
                serializer = BudgetEntrySerializer(data=entry_data)
                if serializer.is_valid():
                    serializer.save()
                    saved_entries.append(serializer.data)
                else:
                    errors.append({key: serializer.errors})
            except Exception as e:
                errors.append({key: str(e)})

        if errors:
            print("Budget save errors:", errors) 
            return JsonResponse({"error": "Failed to save some budget entries. Please check the data and try again."}, status=400)
        
        return JsonResponse({"message": "Budget saved successfully!", "saved_entries": len(saved_entries)}, status=201)

@csrf_exempt
def registerProjectLead(request):
    if request.method == 'POST':
        data = JSONParser().parse(request)
        print(data)
        serializer = ProjectLeadRegistrationSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JsonResponse({"message": "User registered successfully."}, status=201)
        else:
            return JsonResponse({"error": serializer.errors}, status=400)

    return JsonResponse({"error": "Only POST method allowed."}, status=405)